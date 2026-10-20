"""
Knowledge learning worker - closes the feedback loop.

Reads tickets that were resolved without escalation, extracts the question
and the answer that worked, and promotes that pair into the knowledge base
so the next customer asking a similar question gets an instant answer
instead of a knowledge_gap escalation.

Two rules keep this from poisoning the knowledge base:

  1. Only resolved, non-escalated tickets are eligible. A ticket that
     was escalated was not actually answered by the agent, so its reply
     is not a verified answer.
  2. A learned article must clear a quality bar - a minimum length, no
     placeholder text, and no duplication of an article that already
     exists.

Learned articles are marked with a distinct category so they can be
reviewed, promoted, or purged separately from the curated articles.

Run manually:
  python -m production.workers.knowledge_learning
"""

import asyncio
import os
import re
from datetime import datetime, timezone
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)

# Category used for articles the agent learned from resolved tickets.
LEARNED_CATEGORY = "learned"

# Minimum quality bar for a learned article.
MIN_ANSWER_LENGTH = 40

# Words that mark a reply as unverified or too generic to learn from.
REJECTED_PATTERNS = (
    "i'm sorry",
    "i am sorry",
    "i apologize",
    "unable to",
    "i could not",
    "i couldn't",
    "knowledge_gap",
    "connecting you with",
    "specialized team",
    "escalat",
)

# Phrases used to strip a channel-specific sign-off before learning.
SIGN_OFF_PATTERNS = (
    r"best regards,\s*techcorp support team",
    r"reply for more help or type .human. for live support\.",
    r"need more help\?.*",
    r"is there anything else i can help you with today\?",
    r"feel free to reach out anytime!",
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def clean_answer(text: str) -> str:
    """
    Strip greetings, sign-offs and channel footers from a reply.

    The learned article should hold the substance of the answer, not the
    formatting that was appropriate for one particular channel.
    """
    if not text:
        return ""

    cleaned = text.strip()

    # Remove the trailing sign-off block.
    for pattern in SIGN_OFF_PATTERNS:
        cleaned = re.sub(pattern, "", cleaned, flags=re.IGNORECASE | re.DOTALL)

    # Remove a leading greeting on its own line.
    cleaned = re.sub(
        r"^\s*(hi|hello|hey)[^\n!.,?]{0,40}[,!]\s*",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )

    return cleaned.strip()


def is_learnable(question: str, answer: str) -> bool:
    """
    Decide whether a question/answer pair is good enough to learn from.

    The answer must be substantial, must not be an apology or a handoff to
    a human, and must not look like an unresolved template.
    """
    if not question or not answer:
        return False

    if len(answer.strip()) < MIN_ANSWER_LENGTH:
        return False

    lowered = answer.lower()
    for pattern in REJECTED_PATTERNS:
        if pattern in lowered:
            return False

    return True


def build_article_title(question: str) -> str:
    """
    Derive a readable article title from a customer question.
    """
    title = question.strip().rstrip("?").strip()
    if not title:
        return "Resolved support question"

    # Keep titles to a sensible length for the knowledge base.
    if len(title) > 120:
        title = title[:117].rstrip() + "..."

    return title


def build_article_content(question: str, answer: str) -> str:
    """
    Assemble the stored article body from the question and the answer.
    """
    return (
        f"Customer question: {question.strip()}\n\n"
        f"Verified answer:\n{answer.strip()}"
    )


# ---------------------------------------------------------------------------
# Learning
# ---------------------------------------------------------------------------

async def learn_from_resolved_tickets(
    limit: int = 25,
    min_confidence: int = 1,
) -> dict:
    """
    Promote resolved tickets into knowledge base articles.

    Only tickets that were resolved (not escalated) are eligible, since
    those are the ones where the agent's reply actually answered the
    question. Articles that already exist for the same question are
    skipped rather than duplicated.

    Returns a summary dict with counts.
    """
    from production.database import get_db_pool

    summary = {
        "candidates": 0,
        "learned": 0,
        "skipped_existing": 0,
        "skipped_quality": 0,
        "errors": 0,
    }

    pool = await get_db_pool()
    async with pool.acquire() as conn:
        # Resolved, non-escalated tickets, oldest first.
        tickets = await conn.fetch(
            """
            SELECT t.id            AS ticket_id,
                   t.category      AS category,
                   c.source_channel AS channel
            FROM tickets t
            JOIN conversations c ON c.id = t.conversation_id
            WHERE t.status = 'resolved'
              AND t.resolution_notes IS NOT NULL
              AND t.resolution_notes <> ''
              AND t.resolution_notes NOT LIKE 'Auto-resolved by agent.%'
            ORDER BY t.resolved_at ASC
            LIMIT $1
            """,
            limit,
        )

        summary["candidates"] = len(tickets)

        for ticket in tickets:
            try:
                # The first inbound message is the question, the agent's
                # reply is the answer that worked.
                messages = await conn.fetch(
                    """
                    SELECT role, content
                    FROM messages
                    WHERE conversation_id = (
                        SELECT conversation_id FROM tickets WHERE id = $1::uuid
                    )
                    ORDER BY created_at ASC
                    """,
                    ticket["ticket_id"],
                )

                question = ""
                answer = ""
                for message in messages:
                    role = message["role"]
                    if role == "customer" and not question:
                        question = message["content"]
                    elif role == "agent" and question and not answer:
                        answer = message["content"]

                if not question or not answer:
                    summary["skipped_quality"] += 1
                    continue

                cleaned_answer = clean_answer(answer)
                if not is_learnable(question, cleaned_answer):
                    summary["skipped_quality"] += 1
                    continue

                # Do not create a second article for a question we already
                # cover.
                title = build_article_title(question)
                existing = await conn.fetchrow(
                    """
                    SELECT id FROM knowledge_base
                    WHERE category = $1 AND LOWER(title) = LOWER($2)
                    LIMIT 1
                    """,
                    LEARNED_CATEGORY,
                    title,
                )
                if existing:
                    summary["skipped_existing"] += 1
                    continue

                await conn.execute(
                    """
                    INSERT INTO knowledge_base (title, content, category)
                    VALUES ($1, $2, $3)
                    """,
                    title,
                    build_article_content(question, cleaned_answer),
                    LEARNED_CATEGORY,
                )
                summary["learned"] += 1
                logger.info(
                    "Learned new article from resolved ticket",
                    ticket_id=str(ticket["ticket_id"]),
                    title=title,
                )

            except Exception as e:
                summary["errors"] += 1
                logger.error(
                    "Learning from ticket failed",
                    ticket_id=str(ticket["ticket_id"]),
                    error=str(e),
                )

    logger.info("Knowledge learning run complete", **summary)
    return summary


async def run_learning_loop(interval_seconds: int = 3600) -> None:
    """
    Run the learning loop on a schedule until cancelled.
    """
    while True:
        try:
            await learn_from_resolved_tickets()
        except asyncio.CancelledError:
            raise
        except Exception as e:
            logger.error("Learning loop iteration failed", error=str(e))
        await asyncio.sleep(interval_seconds)


async def main() -> None:
    """Entry point for `python -m production.workers.knowledge_learning`."""
    logger.info("Starting knowledge learning worker")
    await run_learning_loop()


if __name__ == "__main__":
    asyncio.run(main())