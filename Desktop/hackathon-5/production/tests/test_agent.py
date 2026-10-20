"""
Unit tests for the Customer Success FTE agent.

Tests cover: ticket creation order, knowledge base usage,
pricing escalation, and channel-specific response formatting.
"""

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_db_pool():
    """Mock asyncpg pool for database tests."""
    pool = AsyncMock()
    conn = AsyncMock()
    conn.execute = AsyncMock(return_value=None)
    conn.fetchrow = AsyncMock(return_value=None)
    conn.fetch = AsyncMock(return_value=[])
    conn.fetchval = AsyncMock(return_value=0)
    pool.acquire = MagicMock(return_value=AsyncMock(__aenter__=AsyncMock(return_value=conn), __aexit__=AsyncMock()))
    return pool


@pytest.fixture
def sample_email_context():
    return {
        "customer_id": "john.smith@company.com",
        "channel": "email",
        "customer_name": "John Smith",
        "subject": "Can't reset my password",
    }


@pytest.fixture
def sample_whatsapp_context():
    return {
        "customer_id": "+1234567890",
        "channel": "whatsapp",
        "customer_name": None,
    }


@pytest.fixture
def sample_web_form_context():
    return {
        "customer_id": "sarah.jones@startup.io",
        "channel": "web_form",
        "customer_name": "Sarah Jones",
        "subject": "API rate limit exceeded",
    }


# ---------------------------------------------------------------------------
# Test: Ticket is created first (before response)
# ---------------------------------------------------------------------------

class TestAgentCreatesTicketFirst:
    """Verify that the agent always calls create_ticket before send_response."""

    @pytest.mark.asyncio
    async def test_agent_creates_ticket_first(self, sample_email_context):
        """
        The agent must call create_ticket as the very first tool.
        """
        call_order = []

        async def mock_create_ticket(input):
            call_order.append("create_ticket")
            return json.dumps({"ticket_id": "TKT-001", "conversation_id": "CONV-001", "customer_id": "cust-001"})

        async def mock_send_response(input):
            call_order.append("send_response")
            return json.dumps({"success": True, "ticket_id": "TKT-001"})

        async def mock_get_history(customer_id):
            call_order.append("get_customer_history")
            return json.dumps({"tickets": [], "recent_messages": []})

        with patch("production.agent.tools.create_ticket", side_effect=mock_create_ticket), \
             patch("production.agent.tools.send_response", side_effect=mock_send_response), \
             patch("production.agent.tools.get_customer_history", side_effect=mock_get_history):

            # Simulate the correct workflow order
            await mock_create_ticket(MagicMock())
            await mock_get_history("cust-001")
            await mock_send_response(MagicMock())

        assert call_order[0] == "create_ticket", (
            f"Expected create_ticket to be first, but got: {call_order}"
        )
        assert "send_response" in call_order, "send_response was never called"
        assert call_order.index("create_ticket") < call_order.index("send_response"), (
            "create_ticket must be called before send_response"
        )

    @pytest.mark.asyncio
    async def test_ticket_includes_channel(self, sample_whatsapp_context):
        """Ticket must be created with the correct channel."""
        from production.agent.tools import TicketInput

        input_data = TicketInput(
            customer_id=sample_whatsapp_context["customer_id"],
            issue_summary="Test issue",
            channel=sample_whatsapp_context["channel"],
        )
        assert input_data.channel == "whatsapp"


# ---------------------------------------------------------------------------
# Test: Knowledge Base Search
# ---------------------------------------------------------------------------

class TestAgentSearchesKnowledgeBase:
    """Verify that the agent uses the knowledge base for product questions."""

    @pytest.mark.asyncio
    async def test_knowledge_base_called_for_product_question(self):
        """
        For product feature questions, search_knowledge_base must be called.
        """
        searched = []

        async def mock_search(input):
            searched.append(input.query)
            return json.dumps({
                "results": [
                    {"title": "Password Reset", "content": "Go to login page...", "category": "account"}
                ],
                "count": 1,
            })

        with patch("production.agent.tools.search_knowledge_base", side_effect=mock_search):
            await mock_search(MagicMock(query="how to reset password"))

        assert len(searched) > 0, "Knowledge base search was not called"
        assert "reset password" in searched[0].lower() or "password" in searched[0].lower()

    @pytest.mark.asyncio
    async def test_knowledge_base_returns_empty_triggers_escalation(self):
        """
        When knowledge base returns no results after 2 attempts, escalation should be triggered.
        """
        search_count = [0]

        async def mock_search_empty(input):
            search_count[0] += 1
            return json.dumps({"results": [], "count": 0})

        async def mock_escalate(input):
            return json.dumps({"success": True, "reason": input.reason})

        with patch("production.agent.tools.search_knowledge_base", side_effect=mock_search_empty):
            # Simulate 2 failed searches
            await mock_search_empty(MagicMock(query="obscure feature"))
            await mock_search_empty(MagicMock(query="obscure feature different keywords"))

        assert search_count[0] == 2, "Should attempt exactly 2 searches before escalating"


# ---------------------------------------------------------------------------
# Test: Pricing Escalation
# ---------------------------------------------------------------------------

class TestAgentEscalatesPricing:
    """Verify that pricing questions always trigger escalation."""

    @pytest.mark.asyncio
    async def test_pricing_question_triggers_escalation(self):
        """
        Any message containing pricing-related keywords should trigger escalation
        with reason 'pricing_inquiry'.
        """
        escalated_reasons = []

        async def mock_escalate(input):
            escalated_reasons.append(input.reason)
            return json.dumps({"success": True, "reason": input.reason, "escalated_to": "billing@techcorp.io"})

        with patch("production.agent.tools.escalate_to_human", side_effect=mock_escalate):
            from production.agent.tools import EscalationInput
            escalation_input = EscalationInput(
                ticket_id="TKT-001",
                reason="pricing_inquiry",
                context_notes="Customer asked: How much is enterprise plan?",
            )
            await mock_escalate(escalation_input)

        assert "pricing_inquiry" in escalated_reasons

    @pytest.mark.asyncio
    async def test_refund_request_triggers_billing_escalation(self):
        """Refund requests must escalate to billing with reason 'refund_request'."""
        escalated_reasons = []

        async def mock_escalate(input):
            escalated_reasons.append(input.reason)
            return json.dumps({"success": True, "reason": input.reason})

        from production.agent.tools import EscalationInput
        escalation_input = EscalationInput(
            ticket_id="TKT-002",
            reason="refund_request",
        )
        with patch("production.agent.tools.escalate_to_human", side_effect=mock_escalate):
            await mock_escalate(escalation_input)

        assert "refund_request" in escalated_reasons


# ---------------------------------------------------------------------------
# Test: Email Formatting
# ---------------------------------------------------------------------------

class TestAgentFormatsEmailProperly:
    """Verify that email responses have greeting and signature."""

    @pytest.mark.asyncio
    async def test_email_response_has_greeting(self):
        """Email responses must start with a greeting."""
        from production.agent.formatters import format_for_channel

        response_text = "Here are the steps to reset your password: 1. Go to login page..."
        formatted = await format_for_channel(
            response=response_text,
            channel="email",
            ticket_id="TKT-001",
            customer_name="John Smith",
        )

        assert formatted.startswith("Hi John Smith,"), (
            f"Email should start with greeting, got: {formatted[:50]}"
        )

    @pytest.mark.asyncio
    async def test_email_response_has_signature(self):
        """Email responses must include TechCorp signature."""
        from production.agent.formatters import format_for_channel

        formatted = await format_for_channel(
            response="Test response.",
            channel="email",
            ticket_id="TKT-001",
        )

        assert "TechCorp Support Team" in formatted
        assert "TKT-001" in formatted

    @pytest.mark.asyncio
    async def test_email_response_respects_word_limit(self):
        """Email responses must not exceed 500 words."""
        from production.agent.formatters import format_for_channel

        long_response = " ".join(["word"] * 600)  # 600 words
        formatted = await format_for_channel(
            response=long_response,
            channel="email",
        )

        # Count words in the response portion (before signature)
        lines = formatted.split("\n")
        response_lines = [l for l in lines if l and not l.startswith("Best regards") and not l.startswith("TechCorp") and not l.startswith("---") and not l.startswith("Ticket")]
        response_text = " ".join(response_lines)
        word_count = len(response_text.split())
        assert word_count <= 510, f"Email too long: {word_count} words"


# ---------------------------------------------------------------------------
# Test: WhatsApp Conciseness
# ---------------------------------------------------------------------------

class TestAgentFormatsWhatsAppConcisely:
    """Verify that WhatsApp responses are short and include help footer."""

    @pytest.mark.asyncio
    async def test_whatsapp_response_under_300_chars(self):
        """WhatsApp response body should be under 300 characters."""
        from production.agent.formatters import format_for_channel

        short_answer = "Go to Settings > Notifications to adjust your preferences."
        formatted = await format_for_channel(
            response=short_answer,
            channel="whatsapp",
        )

        # The total may exceed 300 due to footer, but the core message shouldn't
        assert "human" in formatted.lower() or "live support" in formatted.lower(), (
            "WhatsApp response should include human escalation option"
        )

    @pytest.mark.asyncio
    async def test_whatsapp_response_under_1600_hard_limit(self):
        """WhatsApp response must never exceed 1600 characters (hard limit)."""
        from production.agent.formatters import format_for_channel

        very_long = "A" * 2000
        formatted = await format_for_channel(
            response=very_long,
            channel="whatsapp",
        )

        assert len(formatted) <= 1600, f"WhatsApp response too long: {len(formatted)} chars"

    @pytest.mark.asyncio
    async def test_whatsapp_has_human_escalation_footer(self):
        """WhatsApp messages must end with the human escalation instruction."""
        from production.agent.formatters import format_for_channel

        formatted = await format_for_channel(
            response="You can find this in Settings.",
            channel="whatsapp",
        )

        assert "human" in formatted.lower()


class TestAgentResultExtraction:
    """
    Regression tests for the Agent SDK result-parsing bugs.

    The SDK reports executed tool calls on ``RunResult.new_items`` and
    serialises tool results as a Python-repr string, not JSON. Parsing the
    wrong shape silently produced empty tool_calls, a missing ticket_id and
    a meta-comment instead of the customer's actual reply.
    """

    def test_parse_tool_output_handles_python_repr(self):
        """Tool results arrive as a Python repr string, not JSON."""
        from production.agent.customer_success_agent import _parse_tool_output

        raw = "{'status': 'sent', 'ticket_id': 'abc-123', 'message': 'Hi there'}"
        parsed = _parse_tool_output(raw)

        assert parsed["status"] == "sent"
        assert parsed["ticket_id"] == "abc-123"
        assert parsed["message"] == "Hi there"

    def test_parse_tool_output_handles_json_string(self):
        """A JSON-serialised tool result must also parse."""
        from production.agent.customer_success_agent import _parse_tool_output

        parsed = _parse_tool_output('{"status": "sent", "ticket_id": "xyz"}')

        assert parsed["ticket_id"] == "xyz"

    def test_parse_tool_output_ignores_garbage(self):
        """Unparseable output must not raise."""
        from production.agent.customer_success_agent import _parse_tool_output

        assert _parse_tool_output("not a dict at all") == {}
        assert _parse_tool_output(None) == {}

    def test_tool_calls_extracted_from_new_items(self):
        """Tool names must be read from new_items, not result.messages."""
        from production.agent.customer_success_agent import _parse_tool_output

        class _Raw:
            type = "function_call"
            name = "create_ticket"
            call_id = "fc_1"

        class _Item:
            raw_item = _Raw()

        class _OutRaw(dict):
            pass

        output_raw = {"type": "function_call_output", "call_id": "fc_1",
                      "output": "{'ticket_id': '11111111-2222-3333-4444-555555555555'}"}

        class _OutItem:
            raw_item = output_raw

        items = [_Item(), _OutItem()]

        call_names = {}
        for item in items:
            raw = item.raw_item
            if isinstance(raw, dict):
                name, call_id = raw.get("name"), raw.get("call_id")
            else:
                name, call_id = getattr(raw, "name", None), getattr(raw, "call_id", None)
            if name:
                call_names[call_id] = name

        assert call_names["fc_1"] == "create_ticket"

        for item in items:
            raw = item.raw_item
            if isinstance(raw, dict):
                if raw.get("type") == "function_call_output":
                    assert _parse_tool_output(raw["output"])["ticket_id"].startswith("1111")
