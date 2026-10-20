"""Webhook authenticity validation for inbound channel endpoints.

Both channel webhooks are public HTTP endpoints, so an unauthenticated caller
could inject fake support requests straight into Kafka. Each provider signs
its requests, and these helpers verify that signature before the message is
accepted.

Twilio signs the request URL plus the POST parameters with the account auth
token and sends the result in the X-Twilio-Signature header. Google Pub/Sub
pushes are verified with a shared bearer token set on the subscription.
"""

import base64
import hashlib
import hmac
from typing import Optional

import structlog

logger = structlog.get_logger(__name__)


# ---------------------------------------------------------------------------
# Twilio
# ---------------------------------------------------------------------------

def _twilio_signature(url: str, params: dict, auth_token: str) -> str:
    """
    Reproduce the Twilio request signature.

    Twilio concatenates the full request URL with every POST parameter
    (sorted by key) and signs the result with the account auth token.
    """
    payload = url + "".join(f"{k}{params[k]}" for k in sorted(params))
    digest = hmac.new(
        auth_token.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha1,
    ).digest()
    return base64.b64encode(digest).decode("utf-8")


def validate_twilio_signature(
    url: str,
    params: dict,
    signature: Optional[str],
    auth_token: str,
) -> bool:
    """
    Verify an X-Twilio-Signature header.

    The auth token is the secret, so a request can only be signed by Twilio
    or by someone who already has the token. Comparison is constant-time to
    avoid leaking the expected signature.
    """
    if not auth_token:
        # No secret configured - there is nothing to verify against.
        return False
    if not signature:
        return False

    expected = _twilio_signature(url, params, auth_token)
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# Google Pub/Sub
# ---------------------------------------------------------------------------

def validate_pubsub_token(
    authorization: Optional[str],
    expected_token: str,
) -> bool:
    """
    Verify the bearer token on a Google Pub/Sub push request.

    Pub/Sub sends the configured token in the Authorization header as
    "Bearer <token>". The comparison is constant-time.
    """
    if not expected_token:
        return False
    if not authorization:
        return False

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return False
    return hmac.compare_digest(token.strip(), expected_token)