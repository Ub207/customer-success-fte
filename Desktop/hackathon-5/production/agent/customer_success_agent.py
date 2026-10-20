"""
Customer Success FTE — OpenAI Agents SDK agent definition.

Provider priority (first key found wins):
  OPENAI_API_KEY  → GPT-4o  (paid)
  GROQ_API_KEY    → openai/gpt-oss-120b via Groq (free tier)
  GEMINI_API_KEY  → gemini-1.5-flash via Google AI Studio (free tier)

The agent is initialized lazily on the first call to run_agent() so that
environment variables are guaranteed to be loaded before model selection.
"""

import ast
import json
import os
import time
import structlog

logger = structlog.get_logger(__name__)

try:
    from agents import Agent, Runner, OpenAIChatCompletionsModel
    from openai import AsyncOpenAI
    AGENTS_SDK_AVAILABLE = True
except ImportError:
    AGENTS_SDK_AVAILABLE = False
    Agent = Runner = OpenAIChatCompletionsModel = AsyncOpenAI = None

from production.agent.tools import (
    search_knowledge_base,
    create_ticket,
    get_customer_history,
    escalate_to_human,
    send_response,
)
from production.agent.prompts import CUSTOMER_SUCCESS_SYSTEM_PROMPT

# The five contract tools and the order they must be called in. The system
# prompt states the same order and the tools are registered in it, but a
# reasoning model can still deviate - so the order is verified after every
# run and any violation is logged and reported.
REQUIRED_TOOL_ORDER = [
    "create_ticket",
    "get_customer_history",
    "search_knowledge_base",
    "escalate_to_human",
    "send_response",
]

# The prompt says to follow steps 1-4 "every single time": create_ticket,
# get_customer_history and send_response all run on every conversation. The
# other two are path-dependent - the knowledge base is only consulted for
# product questions, and escalate_to_human only fires on an escalation
# trigger, where the model escalates before attempting to answer.
ALWAYS_REQUIRED_TOOLS = ["create_ticket", "get_customer_history", "send_response"]

# ---------------------------------------------------------------------------
# Lazy singleton
# ---------------------------------------------------------------------------

_agent = None


def _build_model():
    """
    Select the LLM provider based on available API keys.
    Returns a model name string (OpenAI) or an OpenAIChatCompletionsModel
    (Groq / Gemini via OpenAI-compatible endpoint).
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    groq_key   = os.getenv("GROQ_API_KEY", "")
    gemini_key = os.getenv("GEMINI_API_KEY", "")

    if openai_key and not openai_key.startswith("sk-placeholder"):
        logger.info("Agent provider: OpenAI (gpt-4o)")
        return "gpt-4o"

    if groq_key:
        logger.info("Agent provider: Groq (openai/gpt-oss-120b) — free tier")
        client = AsyncOpenAI(
            api_key=groq_key,
            base_url="https://api.groq.com/openai/v1",
        )
        return OpenAIChatCompletionsModel(
            model="openai/gpt-oss-120b",
            openai_client=client,
        )

    if gemini_key:
        logger.info("Agent provider: Google Gemini (gemini-1.5-flash) — free tier")
        client = AsyncOpenAI(
            api_key=gemini_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
        return OpenAIChatCompletionsModel(
            model="gemini-1.5-flash",
            openai_client=client,
        )

    logger.warning("No valid API key found. Set OPENAI_API_KEY, GROQ_API_KEY, or GEMINI_API_KEY.")
    return "gpt-4o"  # will fail at runtime without a key


def _get_agent() -> "Agent":
    """Return the singleton agent, building it on first call."""
    global _agent
    if _agent is None:
        if not AGENTS_SDK_AVAILABLE:
            raise RuntimeError("openai-agents SDK not installed. Run: pip install openai-agents")
        _agent = Agent(
            name="Customer Success FTE",
            model=_build_model(),
            instructions=CUSTOMER_SUCCESS_SYSTEM_PROMPT,
            # Registration order mirrors the required call order. The model
            # sees tools in this order, so keeping it aligned with the
            # contract makes the agent far more likely to follow it.
            tools=[
                create_ticket,
                get_customer_history,
                search_knowledge_base,
                escalate_to_human,
                send_response,
            ],
        )
        logger.info("Customer Success agent initialized")
    return _agent


# ---------------------------------------------------------------------------
# Public entry point — called by the Kafka worker
# ---------------------------------------------------------------------------

async def run_agent(message: str, context: dict) -> dict:
    """
    Run the Customer Success agent for a single inbound message.

    Args:
        message : Raw customer message text.
        context : Dict with keys:
                    customer_id    (str)  — email or phone number
                    channel        (str)  — 'email' | 'whatsapp' | 'web_form'
                    customer_name  (str, optional)
                    subject        (str, optional)
                    conversation_id (str, optional)

    Returns:
        Dict with keys:
            response        (str)   — final agent output
            ticket_id       (str)   — created ticket UUID
            conversation_id (str)   — conversation UUID
            escalated       (bool)
            tool_calls      (list)  — names of tools called
            latency_ms      (int)
            tool_order_ok   (bool)  — tools followed the contract order
    """
    if not AGENTS_SDK_AVAILABLE:
        return _error_response("openai-agents SDK not installed")

    channel         = context.get("channel", "web_form")
    customer_id     = context.get("customer_id", "unknown")
    customer_name   = context.get("customer_name", "")
    subject         = context.get("subject", "")
    conversation_id = context.get("conversation_id", "")

    # Build the context-prefixed message the agent will see
    full_message = (
        f"[Channel: {channel}] "
        f"[Customer: {customer_id}] "
        f"[Name: {customer_name}] "
    )
    if subject:
        full_message += f"[Subject: {subject}] "
    if conversation_id:
        full_message += f"[Conversation: {conversation_id}] "
    full_message += f"\n\nCustomer message: {message}"

    start = time.monotonic()
    try:
        agent  = _get_agent()
        result = await Runner.run(agent, full_message)

        latency_ms = int((time.monotonic() - start) * 1000)

        # Extract tool calls and detect escalation.
        # The SDK exposes executed tool calls on `new_items` as ToolCallItem
        # instances (`.name` holds the tool name). Older SDK builds exposed
        # `result.messages[*].tool_calls`; support both shapes.
        tool_calls = []
        escalated  = False
        ticket_id  = None
        reply_text = None

        # Map call_id -> tool name so outputs can be attributed to their tool.
        call_names = {}
        items = list(getattr(result, "new_items", []) or [])

        for item in items:
            raw = getattr(item, "raw_item", None)
            if isinstance(raw, dict):
                name = raw.get("name")
                call_id = raw.get("call_id")
            else:
                name = getattr(item, "name", None) or getattr(raw, "name", None)
                call_id = getattr(raw, "call_id", None)
            if name:
                tool_calls.append(name)
                if call_id:
                    call_names[call_id] = name

        # Tool outputs carry the data the tools produced (ticket id, the
        # final customer-facing message). The agent's final_output is often
        # just a meta-comment ("The response has been sent..."), so the real
        # reply has to come from the send_response tool result.
        for item in items:
            raw = getattr(item, "raw_item", None)
            if raw is None:
                continue
            # raw_item is a pydantic model for call items but a plain dict
            # for function_call_output items.
            if isinstance(raw, dict):
                item_type = raw.get("type")
                call_id = raw.get("call_id")
                output = raw.get("output")
            else:
                item_type = getattr(raw, "type", None)
                call_id = getattr(raw, "call_id", None)
                output = getattr(raw, "output", None)
            if item_type != "function_call_output":
                continue
            tool_name = call_names.get(call_id)
            if tool_name is None:
                continue
            if output is None:
                output = getattr(item, "output", None)
            parsed = _parse_tool_output(output)
            if not isinstance(parsed, dict):
                continue
            if tool_name == "create_ticket" and parsed.get("ticket_id"):
                ticket_id = parsed["ticket_id"]
            elif tool_name == "send_response":
                escalated = escalated  # keep as-is; send_response is not an escalation
                if parsed.get("message"):
                    reply_text = parsed["message"]
                elif parsed.get("message_preview"):
                    reply_text = parsed["message_preview"]
                if parsed.get("ticket_id"):
                    ticket_id = parsed["ticket_id"]

        for msg in getattr(result, "messages", []) or []:
            for tc in getattr(msg, "tool_calls", None) or []:
                name = tc.function.name if hasattr(tc, "function") else str(tc)
                if name not in tool_calls:
                    tool_calls.append(name)

        if "escalate_to_human" in tool_calls:
            escalated = True

        # Verify the required call order. `search_knowledge_base` may repeat
        # (the prompt allows one retry), so it is collapsed to a single
        # occurrence before comparing.
        # Only the tools that actually ran are compared, so a path that
        # legitimately skips the knowledge base or escalation still passes.
        order_ok = _check_tool_order(tool_calls)
        if not order_ok:
            logger.warning(
                "Agent tool call order deviated from the contract",
                expected=REQUIRED_TOOL_ORDER,
                actual=tool_calls,
            )

        final_response = (
            result.final_output if hasattr(result, "final_output") else str(result)
        )
        # Prefer the message actually sent to the customer over the agent's
        # closing meta-comment.
        if reply_text:
            final_response = reply_text

        logger.info(
            "Agent run complete",
            channel=channel,
            customer_id=customer_id,
            latency_ms=latency_ms,
            escalated=escalated,
            tools_called=tool_calls,
        )

        return {
            "response":        final_response,
            "ticket_id":       ticket_id,
            "conversation_id": conversation_id,
            "escalated":       escalated,
            "tool_calls":      tool_calls,
            "latency_ms":      latency_ms,
            "tool_order_ok":   order_ok,
        }

    except Exception as e:
        latency_ms = int((time.monotonic() - start) * 1000)
        logger.error("Agent run failed", error=str(e), customer_id=customer_id)
        return _error_response(str(e), latency_ms=latency_ms)


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _check_tool_order(tool_calls: list) -> bool:
    """
    Verify the agent followed the tool call contract.

    `create_ticket`, `get_customer_history` and `send_response` run on every
    conversation, so all three must be present. The knowledge base is only
    consulted for product questions, and `escalate_to_human` only fires on an
    escalation trigger, so a path that skips one of them is still valid - but
    the tools that did run must be in contract order.
    """
    collapsed = []
    for name in tool_calls:
        if name not in collapsed:
            collapsed.append(name)

    if not all(name in collapsed for name in ALWAYS_REQUIRED_TOOLS):
        return False

    positions = [
        REQUIRED_TOOL_ORDER.index(name)
        for name in collapsed
        if name in REQUIRED_TOOL_ORDER
    ]
    return positions == sorted(positions)


def _parse_tool_output(output) -> dict:
    """
    Best-effort parse of a tool result into a dict.

    The SDK serialises tool results as a Python repr string
    (single quotes, True/False), not JSON, so ast.literal_eval is tried
    first and json.loads second.
    """
    if isinstance(output, dict):
        return output
    if isinstance(output, str):
        text = output.strip()
        for parser in (ast.literal_eval, json.loads):
            try:
                parsed = parser(text)
                if isinstance(parsed, dict):
                    return parsed
            except (ValueError, TypeError, SyntaxError):
                continue
    return {}


def _error_response(error: str, latency_ms: int = 0) -> dict:
    return {
        "response": (
            "I apologize, but I'm experiencing a technical issue right now. "
            "Your request has been logged and our team will follow up shortly."
        ),
        "ticket_id":       None,
        "conversation_id": None,
        "escalated":       True,
        "tool_calls":      [],
        "latency_ms":      latency_ms,
        "error":           error,
    }
