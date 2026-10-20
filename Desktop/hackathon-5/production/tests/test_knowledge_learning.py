"""
Tests for the knowledge learning worker.

The worker turns resolved tickets into knowledge base articles. The risk is
poisoning the knowledge base with replies that were never actually answers,
so most of these tests are about what must be rejected.
"""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Answer cleaning
# ---------------------------------------------------------------------------

class TestCleanAnswer:
    """Sign-offs and greetings must not end up in a learned article."""

    def test_removes_email_sign_off(self):
        """The TechCorp email sign-off is stripped."""
        from production.workers.knowledge_learning import clean_answer

        answer = (
            "Click Settings, then Security, then enable 2FA.\n\n"
            "Best regards,\nTechCorp Support Team"
        )
        cleaned = clean_answer(answer)

        assert "Best regards" not in cleaned
        assert "TechCorp Support Team" not in cleaned
        assert "enable 2FA" in cleaned

    def test_removes_whatsapp_footer(self):
        """The WhatsApp live-support footer is stripped."""
        from production.workers.knowledge_learning import clean_answer

        answer = (
            "You can export from Settings > Data. "
            "Reply for more help or type 'human' for live support."
        )
        cleaned = clean_answer(answer)

        assert "live support" not in cleaned
        assert "export from Settings" in cleaned

    def test_removes_leading_greeting(self):
        """A leading greeting is dropped so the article starts with content."""
        from production.workers.knowledge_learning import clean_answer

        cleaned = clean_answer("Hi John,\nGo to Settings and open the API tab.")

        assert not cleaned.startswith("Hi John")
        assert "API tab" in cleaned

    def test_keeps_meaningful_content(self):
        """Cleaning must not throw away the actual answer."""
        from production.workers.knowledge_learning import clean_answer

        answer = "Open the Integrations tab, click Connect, and pick your provider."
        cleaned = clean_answer(answer)

        assert cleaned == answer

    def test_empty_answer_stays_empty(self):
        """An empty reply cleans to an empty string."""
        from production.workers.knowledge_learning import clean_answer

        assert clean_answer("") == ""
        assert clean_answer(None) == ""


# ---------------------------------------------------------------------------
# Quality gate
# ---------------------------------------------------------------------------

class TestIsLearnable:
    """Only verified, substantial answers may be learned from."""

    def test_substantial_answer_is_learnable(self):
        """A real, detailed answer passes."""
        from production.workers.knowledge_learning import is_learnable

        question = "How do I reset my password?"
        answer = (
            "Go to app.techcorp.io/login, click Forgot Password, and enter "
            "your email. The reset link expires after 24 hours."
        )

        assert is_learnable(question, answer) is True

    def test_short_answer_is_rejected(self):
        """A one-liner is not worth an article."""
        from production.workers.knowledge_learning import is_learnable

        assert is_learnable("What is the API limit?", "It's 1000.") is False

    def test_apology_is_rejected(self):
        """An apology means the agent did not answer."""
        from production.workers.knowledge_learning import is_learnable

        answer = (
            "I'm sorry, I could not find the information you were looking for "
            "in our knowledge base at this time."
        )

        assert is_learnable("How do I do X?", answer) is False

    def test_human_handoff_is_rejected(self):
        """A reply that hands off to a human is not a verified answer."""
        from production.workers.knowledge_learning import is_learnable

        answer = (
            "This needs attention from our specialized team. I'm connecting "
            "you with our billing experts right now."
        )

        assert is_learnable("How much is enterprise?", answer) is False

    def test_empty_question_is_rejected(self):
        """An article needs a question to be titled from."""
        from production.workers.knowledge_learning import is_learnable

        assert is_learnable("", "A perfectly good answer that is long enough.") is False

    def test_empty_answer_is_rejected(self):
        """An article needs an answer."""
        from production.workers.knowledge_learning import is_learnable

        assert is_learnable("How do I reset my password?", "") is False


# ---------------------------------------------------------------------------
# Article construction
# ---------------------------------------------------------------------------

class TestArticleConstruction:
    """Learned articles must be readable and deduplicated."""

    def test_title_drops_trailing_question_mark(self):
        """The question mark does not belong in a title."""
        from production.workers.knowledge_learning import build_article_title

        assert build_article_title("How do I reset my password?") == (
            "How do I reset my password"
        )

    def test_title_is_truncated(self):
        """A very long question must not overflow the title column."""
        from production.workers.knowledge_learning import build_article_title

        title = build_article_title("a" * 300 + "?")

        assert len(title) <= 120
        assert title.endswith("...")

    def test_empty_question_gets_default_title(self):
        """A missing question still produces a usable title."""
        from production.workers.knowledge_learning import build_article_title

        assert build_article_title("") == "Resolved support question"

    def test_content_keeps_question_and_answer(self):
        """The article must record both what was asked and what worked."""
        from production.workers.knowledge_learning import build_article_content

        content = build_article_content(
            "How do I add a member?",
            "Open Settings, then Team, then Invite.",
        )

        assert "How do I add a member?" in content
        assert "Open Settings, then Team, then Invite." in content

    def test_learned_category_is_distinct(self):
        """Learned articles must be distinguishable from curated ones."""
        from production.workers.knowledge_learning import LEARNED_CATEGORY

        assert LEARNED_CATEGORY == "learned"


# ---------------------------------------------------------------------------
# The learning pass
# ---------------------------------------------------------------------------

class TestLearnFromResolvedTickets:
    """The database pass must only learn from resolved, non-escalated tickets."""

    def _pool(self, tickets, messages, existing=None):
        """Build a mock pool returning the given rows."""
        conn = AsyncMock()
        conn.fetch = AsyncMock(side_effect=[tickets, messages])
        conn.fetchrow = AsyncMock(return_value=existing)
        conn.execute = AsyncMock(return_value=None)

        pool = MagicMock()
        pool.acquire = MagicMock(
            return_value=AsyncMock(
                __aenter__=AsyncMock(return_value=conn),
                __aexit__=AsyncMock(),
            )
        )
        return pool, conn

    @pytest.mark.asyncio
    async def test_learns_from_a_resolved_ticket(self):
        """A resolved ticket with a good answer becomes an article."""
        from production.workers.knowledge_learning import learn_from_resolved_tickets

        tickets = [
            {
                "ticket_id": "tkt-1",
                "category": "account",
                "channel": "email",
            }
        ]
        messages = [
            {
                "role": "customer",
                "content": "How do I reset my password?",
            },
            {
                "role": "agent",
                "content": (
                    "Go to app.techcorp.io/login, click Forgot Password, and "
                    "enter your email. The reset link expires after 24 hours."
                ),
            },
        ]
        pool, conn = self._pool(tickets, messages)

        with patch("production.database.get_db_pool", return_value=pool):
            summary = await learn_from_resolved_tickets()

        assert summary["learned"] == 1
        conn.execute.assert_awaited_once()

        # The insert must carry the learned category so it can be reviewed.
        args = conn.execute.await_args[0]
        assert "learned" in args

    @pytest.mark.asyncio
    async def test_skips_a_duplicate_article(self):
        """An article that already exists is not created twice."""
        from production.workers.knowledge_learning import learn_from_resolved_tickets

        tickets = [{"ticket_id": "tkt-1", "category": "account", "channel": "email"}]
        messages = [
            {"role": "customer", "content": "How do I reset my password?"},
            {
                "role": "agent",
                "content": (
                    "Go to app.techcorp.io/login, click Forgot Password, and "
                    "enter your email. The reset link expires after 24 hours."
                ),
            },
        ]
        pool, conn = self._pool(
            tickets, messages, existing={"id": "kb-1"}
        )

        with patch("production.database.get_db_pool", return_value=pool):
            summary = await learn_from_resolved_tickets()

        assert summary["learned"] == 0
        assert summary["skipped_existing"] == 1
        conn.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_skips_a_low_quality_answer(self):
        """A reply that was not a real answer is not learned from."""
        from production.workers.knowledge_learning import learn_from_resolved_tickets

        tickets = [{"ticket_id": "tkt-1", "category": "account", "channel": "email"}]
        messages = [
            {"role": "customer", "content": "How much is enterprise?"},
            {
                "role": "agent",
                "content": (
                    "I'm sorry, I could not find that information right now. "
                    "I'm connecting you with our specialized team."
                ),
            },
        ]
        pool, conn = self._pool(tickets, messages)

        with patch("production.database.get_db_pool", return_value=pool):
            summary = await learn_from_resolved_tickets()

        assert summary["learned"] == 0
        assert summary["skipped_quality"] == 1
        conn.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_skips_a_ticket_with_no_reply(self):
        """A conversation with no agent reply cannot be learned from."""
        from production.workers.knowledge_learning import learn_from_resolved_tickets

        tickets = [{"ticket_id": "tkt-1", "category": "account", "channel": "email"}]
        messages = [
            {"role": "customer", "content": "How do I reset my password?"},
        ]
        pool, conn = self._pool(tickets, messages)

        with patch("production.database.get_db_pool", return_value=pool):
            summary = await learn_from_resolved_tickets()

        assert summary["learned"] == 0
        conn.execute.assert_not_awaited()

    @pytest.mark.asyncio
    async def test_no_candidates_is_a_no_op(self):
        """With nothing resolved there is nothing to learn."""
        from production.workers.knowledge_learning import learn_from_resolved_tickets

        pool, conn = self._pool([], [])

        with patch("production.database.get_db_pool", return_value=pool):
            summary = await learn_from_resolved_tickets()

        assert summary["candidates"] == 0
        assert summary["learned"] == 0
        conn.execute.assert_not_awaited()