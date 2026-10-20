"""
Tests for webhook authenticity validation.

The channel webhooks are public HTTP endpoints. Without signature checks
anyone could POST forged support messages into Kafka, so both providers
verify the request before it is queued.
"""

import pytest
from unittest.mock import AsyncMock, patch


# ---------------------------------------------------------------------------
# Twilio signature
# ---------------------------------------------------------------------------

class TestTwilioSignature:
    """Verify the X-Twilio-Signature header check."""

    def test_matches_twilio_documented_example(self):
        """
        The signature must match Twilio's published reference example.

        Twilio signs the request URL plus every POST parameter sorted by key,
        using the account auth token as the HMAC key.
        """
        from production.channels.webhook_security import _twilio_signature

        url = "https://mycompany.com/myapp.php?foo=1&bar=2"
        params = {
            "CallSid": "CA1234567890ABCDE",
            "Caller": "+14158675309",
            "Digits": "1234",
            "From": "+14158675309",
            "To": "+18005551212",
        }

        assert _twilio_signature(url, params, "12345") == "RSOYDt4T1cUTdK1PDd93/VVr8B8="

    def test_valid_signature_is_accepted(self):
        """A correctly signed request passes validation."""
        from production.channels.webhook_security import (
            _twilio_signature,
            validate_twilio_signature,
        )

        url = "https://example.com/webhooks/whatsapp"
        params = {"Body": "hello", "From": "+1234567890"}
        token = "secret-token"
        signature = _twilio_signature(url, params, token)

        assert validate_twilio_signature(url, params, signature, token) is True

    def test_tampered_body_is_rejected(self):
        """Changing the message after signing invalidates the signature."""
        from production.channels.webhook_security import (
            _twilio_signature,
            validate_twilio_signature,
        )

        url = "https://example.com/webhooks/whatsapp"
        original = {"Body": "hello", "From": "+1234567890"}
        token = "secret-token"
        signature = _twilio_signature(url, original, token)

        tampered = {"Body": "refund my account now", "From": "+1234567890"}
        assert validate_twilio_signature(url, tampered, signature, token) is False

    def test_wrong_url_is_rejected(self):
        """The signature is bound to the request URL."""
        from production.channels.webhook_security import (
            _twilio_signature,
            validate_twilio_signature,
        )

        params = {"Body": "hello"}
        token = "secret-token"
        signature = _twilio_signature("https://example.com/webhooks/whatsapp", params, token)

        assert validate_twilio_signature("https://evil.com/webhooks/whatsapp", params, signature, token) is False

    def test_missing_signature_is_rejected(self):
        """A request with no signature header cannot be verified."""
        from production.channels.webhook_security import validate_twilio_signature

        assert validate_twilio_signature("https://example.com", {"a": "1"}, None, "token") is False

    def test_missing_auth_token_is_rejected(self):
        """With no secret configured there is nothing to verify against."""
        from production.channels.webhook_security import (
            _twilio_signature,
            validate_twilio_signature,
        )

        url = "https://example.com"
        params = {"a": "1"}
        signature = _twilio_signature(url, params, "token")

        assert validate_twilio_signature(url, params, signature, "") is False


# ---------------------------------------------------------------------------
# Pub/Sub token
# ---------------------------------------------------------------------------

class TestPubSubToken:
    """Verify the Pub/Sub push bearer token check."""

    def test_valid_bearer_token_is_accepted(self):
        """A correctly authenticated push passes validation."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token("Bearer s3cr3t", "s3cr3t") is True

    def test_bearer_scheme_is_case_insensitive(self):
        """HTTP auth schemes are case-insensitive."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token("bearer s3cr3t", "s3cr3t") is True

    def test_wrong_token_is_rejected(self):
        """A push with the wrong bearer token is rejected."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token("Bearer wrong", "s3cr3t") is False

    def test_missing_authorization_header_is_rejected(self):
        """A push with no Authorization header is rejected."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token(None, "s3cr3t") is False

    def test_non_bearer_scheme_is_rejected(self):
        """Only the Bearer scheme is accepted."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token("Basic s3cr3t", "s3cr3t") is False

    def test_missing_expected_token_is_rejected(self):
        """With no token configured nothing can be verified."""
        from production.channels.webhook_security import validate_pubsub_token

        assert validate_pubsub_token("Bearer s3cr3t", "") is False


# ---------------------------------------------------------------------------
# Endpoint integration
# ---------------------------------------------------------------------------

class TestWebhookEndpointsRejectForgeries:
    """The endpoints themselves must reject unsigned or badly signed pushes."""

    @pytest.mark.asyncio
    async def test_whatsapp_webhook_rejects_invalid_signature(self, monkeypatch):
        """A WhatsApp push with a bad signature gets a 403 and is not queued."""
        from fastapi.testclient import TestClient
        from production.api.main import app

        monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secret-token")
        monkeypatch.delenv("WEBHOOK_BASE_URL", raising=False)

        mock_producer = AsyncMock()
        mock_producer.send = AsyncMock(return_value=None)

        with patch("production.channels.whatsapp_handler._get_producer", return_value=mock_producer):
            client = TestClient(app)
            response = client.post(
                "/webhooks/whatsapp",
                data={"MessageSid": "SM1", "From": "+1234567890", "Body": "hello"},
                headers={"X-Twilio-Signature": "not-a-valid-signature"},
            )

        assert response.status_code == 403
        mock_producer.send.assert_not_called()

    @pytest.mark.asyncio
    async def test_whatsapp_webhook_accepts_valid_signature(self, monkeypatch):
        """A correctly signed WhatsApp push is accepted and queued."""
        from fastapi.testclient import TestClient
        from production.api.main import app
        from production.channels.webhook_security import _twilio_signature

        monkeypatch.setenv("TWILIO_AUTH_TOKEN", "secret-token")
        monkeypatch.setenv("WEBHOOK_BASE_URL", "https://example.com")

        data = {"MessageSid": "SM1", "From": "+1234567890", "Body": "hello"}
        signature = _twilio_signature(
            "https://example.com/webhooks/whatsapp", data, "secret-token"
        )

        mock_producer = AsyncMock()
        mock_producer.send = AsyncMock(return_value=None)

        with patch("production.channels.whatsapp_handler._get_producer", return_value=mock_producer):
            client = TestClient(app)
            response = client.post(
                "/webhooks/whatsapp",
                data=data,
                headers={"X-Twilio-Signature": signature},
            )

        assert response.status_code == 200
        mock_producer.send.assert_called_once()

    @pytest.mark.asyncio
    async def test_gmail_webhook_rejects_invalid_token(self, monkeypatch):
        """A Gmail push with a bad bearer token gets a 403 and is not queued."""
        from fastapi.testclient import TestClient
        from production.api.main import app

        monkeypatch.setenv("PUBSUB_VERIFICATION_TOKEN", "s3cr3t")

        mock_producer = AsyncMock()
        mock_producer.send = AsyncMock(return_value=None)

        with patch("production.channels.gmail_handler._get_producer", return_value=mock_producer):
            client = TestClient(app)
            response = client.post(
                "/webhooks/gmail",
                json={"message": {"data": ""}},
                headers={"Authorization": "Bearer wrong"},
            )

        assert response.status_code == 403
        mock_producer.send.assert_not_called()

    @pytest.mark.asyncio
    async def test_gmail_webhook_accepts_valid_token(self, monkeypatch):
        """A correctly authenticated Gmail push is accepted."""
        from fastapi.testclient import TestClient
        from production.api.main import app

        monkeypatch.setenv("PUBSUB_VERIFICATION_TOKEN", "s3cr3t")

        mock_producer = AsyncMock()
        mock_producer.send = AsyncMock(return_value=None)

        with patch("production.channels.gmail_handler._get_producer", return_value=mock_producer):
            client = TestClient(app)
            response = client.post(
                "/webhooks/gmail",
                json={"message": {"data": ""}},
                headers={"Authorization": "Bearer s3cr3t"},
            )

        # An empty payload is ignored, but it must not be rejected as a forgery.
        assert response.status_code == 200