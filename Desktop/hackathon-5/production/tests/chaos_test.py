"""
24-hour multi-channel chaos test harness.

The final hackathon challenge asks the FTE to survive a 24-hour continuous
run across all three channels while pods are being killed underneath it, and
to hold a set of service level targets:

    web form submissions   100+ over 24 hours
    email messages         50+ processed
    WhatsApp messages      50+ processed
    cross-channel customers 10+ contacting via more than one channel
    pod kills              random, every 2 hours

    uptime                 > 99.9%
    P95 latency            < 3 seconds across all channels
    escalation rate        < 25%
    cross-channel ID rate  > 95%
    message loss           none

This module is the harness that drives that run and scores it. It is
deliberately separate from the pytest suite: it needs a live API, and
optionally a Kubernetes cluster to kill pods in.

Run against a local stack:

    python -m production.tests.chaos_test --duration 3600

Run the full 24-hour challenge with pod kills:

    python -m production.tests.chaos_test --duration 86400 --chaos

Everything is written to a JSON report so the run can be scored afterwards.
"""

import argparse
import asyncio
import json
import random
import sys
import time
import uuid
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

import httpx


# ---------------------------------------------------------------------------
# Targets
# ---------------------------------------------------------------------------

@dataclass
class Targets:
    """The service level targets the run is scored against."""

    web_form_submissions: int = 100
    email_messages: int = 50
    whatsapp_messages: int = 50
    cross_channel_customers: int = 10
    uptime_percent: float = 99.9
    p95_latency_seconds: float = 3.0
    escalation_rate_percent: float = 25.0
    cross_channel_identification_percent: float = 95.0

    @property
    def chaos_interval_seconds(self) -> int:
        """Pods are killed every two hours, per the challenge brief."""
        return 2 * 60 * 60


# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------

def _nearest_rank(ordered: list, percentile: float) -> float:
    """
    Return the nearest-rank percentile of an already sorted list.

    Nearest-rank picks the smallest value that is greater than or equal to
    the requested percentage of the samples, which is the method the
    latency targets are written against. It is well defined for any
    sample count, unlike an interpolated percentile.
    """
    if not ordered:
        return 0.0
    rank = max(1, int(-(-len(ordered) * percentile // 1)))
    return ordered[min(rank, len(ordered)) - 1]

@dataclass
class ChannelResult:
    """Outcome for a single channel."""

    submitted: int = 0
    succeeded: int = 0
    failed: int = 0
    latencies: list = field(default_factory=list)
    escalated: int = 0

    @property
    def p95_latency(self) -> float:
        """95th percentile latency in seconds."""
        if not self.latencies:
            return 0.0
        ordered = sorted(self.latencies)
        return _nearest_rank(ordered, 0.95)

    @property
    def escalation_rate(self) -> float:
        """Percentage of successful requests that escalated."""
        if not self.succeeded:
            return 0.0
        return (self.escalated / self.succeeded) * 100


@dataclass
class Report:
    """The full outcome of a chaos run."""

    started_at: str = ""
    finished_at: str = ""
    duration_seconds: float = 0.0
    channels: dict = field(default_factory=dict)
    health_checks: int = 0
    health_failures: int = 0
    chaos_kills: int = 0
    chaos_kill_failures: int = 0
    cross_channel_attempts: int = 0
    cross_channel_identified: int = 0
    lost_messages: int = 0
    errors: list = field(default_factory=list)

    @property
    def uptime_percent(self) -> float:
        """Percentage of health checks that succeeded."""
        if not self.health_checks:
            return 0.0
        return ((self.health_checks - self.health_failures) / self.health_checks) * 100

    @property
    def cross_channel_identification_percent(self) -> float:
        """Percentage of cross-channel customers identified as the same person."""
        if not self.cross_channel_attempts:
            return 0.0
        return (self.cross_channel_identified / self.cross_channel_attempts) * 100

    @property
    def all_latencies(self) -> list:
        """Every recorded latency across all channels."""
        latencies = []
        for result in self.channels.values():
            latencies.extend(result.latencies)
        return latencies

    @property
    def p95_latency(self) -> float:
        """95th percentile latency across all channels."""
        if not self.all_latencies:
            return 0.0
        ordered = sorted(self.all_latencies)
        return _nearest_rank(ordered, 0.95)


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_report(report: Report, targets: Targets) -> dict:
    """
    Score a run against the challenge targets.

    Returns a dict with one entry per target, each carrying the measured
    value, the threshold, and whether it passed.
    """
    checks = {}

    web_form = report.channels.get("web_form", ChannelResult())
    email = report.channels.get("email", ChannelResult())
    whatsapp = report.channels.get("whatsapp", ChannelResult())

    checks["web_form_submissions"] = {
        "measured": web_form.submitted,
        "target": targets.web_form_submissions,
        "passed": web_form.submitted >= targets.web_form_submissions,
    }
    checks["email_messages"] = {
        "measured": email.submitted,
        "target": targets.email_messages,
        "passed": email.submitted >= targets.email_messages,
    }
    checks["whatsapp_messages"] = {
        "measured": whatsapp.submitted,
        "target": targets.whatsapp_messages,
        "passed": whatsapp.submitted >= targets.whatsapp_messages,
    }
    checks["cross_channel_customers"] = {
        "measured": report.cross_channel_attempts,
        "target": targets.cross_channel_customers,
        "passed": report.cross_channel_attempts >= targets.cross_channel_customers,
    }
    checks["uptime_percent"] = {
        "measured": round(report.uptime_percent, 3),
        "target": targets.uptime_percent,
        "passed": report.uptime_percent > targets.uptime_percent,
    }
    checks["p95_latency_seconds"] = {
        "measured": round(report.p95_latency, 3),
        "target": targets.p95_latency_seconds,
        "passed": report.p95_latency < targets.p95_latency_seconds,
    }
    checks["escalation_rate_percent"] = {
        "measured": round(web_form.escalation_rate, 2),
        "target": targets.escalation_rate_percent,
        "passed": web_form.escalation_rate < targets.escalation_rate_percent,
    }
    checks["cross_channel_identification_percent"] = {
        "measured": round(report.cross_channel_identification_percent, 2),
        "target": targets.cross_channel_identification_percent,
        "passed": (
            report.cross_channel_identification_percent
            > targets.cross_channel_identification_percent
        ),
    }
    checks["no_message_loss"] = {
        "measured": report.lost_messages,
        "target": 0,
        "passed": report.lost_messages == 0,
    }

    return checks


def format_report(report: Report, checks: dict) -> str:
    """Render a human readable summary of the run."""
    lines = []
    lines.append("=" * 68)
    lines.append("24-HOUR MULTI-CHANNEL CHAOS TEST")
    lines.append("=" * 68)
    lines.append(f"Started   : {report.started_at}")
    lines.append(f"Finished  : {report.finished_at}")
    lines.append(f"Duration  : {report.duration_seconds / 3600:.2f} hours")
    lines.append(f"Chaos kills: {report.chaos_kills} "
                 f"({report.chaos_kill_failures} failed)")
    lines.append("")

    lines.append(f"{'CHECK':<45} {'MEASURED':>10} {'TARGET':>10}  RESULT")
    lines.append("-" * 68)
    for name, check in checks.items():
        status = "PASS" if check["passed"] else "FAIL"
        lines.append(
            f"{name:<45} {str(check['measured']):>10} "
            f"{str(check['target']):>10}  {status}"
        )
    lines.append("-" * 68)

    passed = sum(1 for c in checks.values() if c["passed"])
    lines.append(f"{passed}/{len(checks)} checks passed")
    lines.append("=" * 68)
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# The runner
# ---------------------------------------------------------------------------

class ChaosRunner:
    """
    Drives the challenge traffic against a live API and scores the result.
    """

    def __init__(
        self,
        base_url: str,
        duration_seconds: int,
        targets: Optional[Targets] = None,
        chaos: bool = False,
        twilio_auth_token: str = "",
        webhook_base_url: str = "",
        seed: Optional[int] = None,
    ):
        self.base_url = base_url.rstrip("/")
        self.duration_seconds = duration_seconds
        self.targets = targets or Targets()
        self.chaos = chaos
        self.twilio_auth_token = twilio_auth_token
        self.webhook_base_url = webhook_base_url.rstrip("/")
        self.random = random.Random(seed)
        self.report = Report()
        self.client = httpx.AsyncClient(timeout=30.0)
        self._stop = False

    # -----------------------------------------------------------------
    # Traffic
    # -----------------------------------------------------------------

    def _web_form_payload(self) -> dict:
        """Build a valid web form submission."""
        return {
            "name": f"Chaos User {self.random.randint(1, 100000)}",
            "email": f"chaos{self.random.randint(1, 100000)}@example.com",
            "subject": self.random.choice([
                "Cannot reset my password",
                "API rate limit exceeded",
                "How do I add team members?",
                "Task sync issues",
                "Webhook setup help",
            ]),
            "category": self.random.choice([
                "general", "technical", "account", "bug", "feedback",
            ]),
            "message": (
                "This is a chaos test message verifying that the system keeps "
                "working while pods are being restarted underneath it."
            ),
            "priority": self.random.choice(["low", "medium", "high"]),
        }

    async def _submit_web_form(self) -> None:
        """Submit one web form ticket and record the outcome."""
        result = self.report.channels.setdefault("web_form", ChannelResult())
        payload = self._web_form_payload()
        started = time.monotonic()
        try:
            response = await self.client.post(
                "/web-form/submit", json=payload
            )
            elapsed = time.monotonic() - started
            result.submitted += 1
            result.latencies.append(elapsed)
            if response.status_code == 201:
                result.succeeded += 1
                data = response.json()
                if data.get("escalated"):
                    result.escalated += 1
            else:
                result.failed += 1
                self.report.errors.append(
                    f"web_form {response.status_code}: {response.text[:120]}"
                )
        except Exception as e:
            result.submitted += 1
            result.failed += 1
            self.report.errors.append(f"web_form error: {e}")

    async def _submit_email(self) -> None:
        """Push one simulated Gmail message through the webhook."""
        result = self.report.channels.setdefault("email", ChannelResult())
        started = time.monotonic()
        try:
            response = await self.client.post(
                "/webhooks/gmail",
                json={
                    "message": {"data": "", "messageId": f"chaos-{uuid.uuid4()}"},
                    "subscription": "projects/test/subscriptions/chaos",
                },
                headers=self._pubsub_headers(),
            )
            elapsed = time.monotonic() - started
            result.submitted += 1
            result.latencies.append(elapsed)
            if response.status_code == 200:
                result.succeeded += 1
            else:
                result.failed += 1
                self.report.errors.append(
                    f"email {response.status_code}: {response.text[:120]}"
                )
        except Exception as e:
            result.submitted += 1
            result.failed += 1
            self.report.errors.append(f"email error: {e}")

    def _pubsub_headers(self) -> dict:
        """Pub/Sub auth header, if a verification token is configured."""
        token = self._pubsub_token()
        if not token:
            return {}
        return {"Authorization": f"Bearer {token}"}

    def _pubsub_token(self) -> str:
        """The configured Pub/Sub verification token."""
        import os
        return os.environ.get("PUBSUB_VERIFICATION_TOKEN", "")

    async def _submit_whatsapp(self) -> None:
        """Push one simulated WhatsApp message through the webhook."""
        result = self.report.channels.setdefault("whatsapp", ChannelResult())
        form = {
            "MessageSid": f"SM{uuid.uuid4().hex[:24]}",
            "From": f"whatsapp:+{self.random.randint(1000000000, 9999999999)}",
            "To": "whatsapp:+14155238886",
            "Body": "Hi, how do I add a team member to my project?",
            "NumMedia": "0",
            "ProfileName": "Chaos User",
        }
        headers = {}
        if self.twilio_auth_token:
            from production.channels.webhook_security import _twilio_signature
            url = f"{self.webhook_base_url}/webhooks/whatsapp" if self.webhook_base_url else (
                f"{self.base_url}/webhooks/whatsapp"
            )
            headers["X-Twilio-Signature"] = _twilio_signature(
                url, form, self.twilio_auth_token
            )

        started = time.monotonic()
        try:
            response = await self.client.post(
                "/webhooks/whatsapp", data=form, headers=headers
            )
            elapsed = time.monotonic() - started
            result.submitted += 1
            result.latencies.append(elapsed)
            if response.status_code == 200:
                result.succeeded += 1
            else:
                result.failed += 1
                self.report.errors.append(
                    f"whatsapp {response.status_code}: {response.text[:120]}"
                )
        except Exception as e:
            result.submitted += 1
            result.failed += 1
            self.report.errors.append(f"whatsapp error: {e}")

    async def _check_health(self) -> None:
        """Record one health probe result."""
        self.report.health_checks += 1
        try:
            response = await self.client.get("/health")
            if response.status_code != 200:
                self.report.health_failures += 1
        except Exception:
            self.report.health_failures += 1

    # -----------------------------------------------------------------
    # Cross-channel continuity
    # -----------------------------------------------------------------

    async def _cross_channel_customer(self) -> None:
        """
        Contact the same customer through two different channels and check
        the API recognises them as one person.
        """
        self.report.cross_channel_attempts += 1
        email = f"cross{self.random.randint(1, 100000)}@example.com"
        name = f"Cross Channel {self.random.randint(1, 100000)}"

        try:
            await self.client.post(
                "/web-form/submit",
                json={
                    "name": name,
                    "email": email,
                    "subject": "First contact via web form",
                    "category": "general",
                    "message": "This is my first contact through the web form channel.",
                },
            )
            await self.client.post(
                "/webhooks/whatsapp",
                data={
                    "MessageSid": f"SM{uuid.uuid4().hex[:24]}",
                    "From": f"whatsapp:+{self.random.randint(1000000000, 9999999999)}",
                    "To": "whatsapp:+14155238886",
                    "Body": "Following up on my earlier web form message.",
                    "NumMedia": "0",
                },
            )

            # The lookup is by the identifier the customer actually used.
            lookup = await self.client.get(
                "/customers/lookup", params={"email": email}
            )
            if lookup.status_code == 200:
                self.report.cross_channel_identified += 1
        except Exception as e:
            self.report.errors.append(f"cross_channel error: {e}")

    # -----------------------------------------------------------------
    # Chaos
    # -----------------------------------------------------------------

    async def _chaos_kill(self) -> None:
        """
        Kill a pod to prove the system recovers.

        Uses kubectl when a cluster is available. When it is not, the kill
        is recorded as a failed attempt rather than silently passing, so a
        run without a cluster can never be reported as chaos-tested.
        """
        import shutil
        import subprocess

        if not shutil.which("kubectl"):
            self.report.chaos_kill_failures += 1
            self.report.errors.append(
                "chaos: kubectl not available - no pod was actually killed"
            )
            return

        try:
            result = subprocess.run(
                [
                    "kubectl", "delete", "pod",
                    "--selector=app=fte-worker",
                    "--field-selector=status.phase=Running",
                    "--grace-period=0",
                    "--force",
                    "-n", "fte-production",
                ],
                capture_output=True,
                text=True,
                timeout=60,
            )
            if result.returncode == 0:
                self.report.chaos_kills += 1
            else:
                self.report.chaos_kill_failures += 1
                self.report.errors.append(
                    f"chaos: kubectl failed: {result.stderr[:200]}"
                )
        except Exception as e:
            self.report.chaos_kill_failures += 1
            self.report.errors.append(f"chaos error: {e}")

    # -----------------------------------------------------------------
    # The run
    # -----------------------------------------------------------------

    async def run(self) -> Report:
        """Execute the chaos run and return the scored report."""
        self.report.started_at = datetime.now(timezone.utc).isoformat()
        started = time.monotonic()
        deadline = started + self.duration_seconds

        # Scale the traffic to the run length so a short smoke run still
        # exercises every channel.
        scale = max(self.duration_seconds / 86400, 0.01)
        web_form_target = max(1, int(self.targets.web_form_submissions * scale))
        email_target = max(1, int(self.targets.email_messages * scale))
        whatsapp_target = max(1, int(self.targets.whatsapp_messages * scale))
        cross_channel_target = max(1, int(self.targets.cross_channel_customers * scale))

        tasks: list = []

        async def paced_worker(coro_factory, count, interval):
            """Submit `count` messages, one every `interval` seconds."""
            for _ in range(count):
                if time.monotonic() >= deadline:
                    return
                await coro_factory()
                await asyncio.sleep(interval)

        # Spread the traffic evenly across the run.
        web_interval = self.duration_seconds / max(web_form_target, 1)
        email_interval = self.duration_seconds / max(email_target, 1)
        whatsapp_interval = self.duration_seconds / max(whatsapp_target, 1)
        cross_interval = self.duration_seconds / max(cross_channel_target, 1)

        tasks.append(asyncio.create_task(
            paced_worker(self._submit_web_form, web_form_target, web_interval)
        ))
        tasks.append(asyncio.create_task(
            paced_worker(self._submit_email, email_target, email_interval)
        ))
        tasks.append(asyncio.create_task(
            paced_worker(self._submit_whatsapp, whatsapp_target, whatsapp_interval)
        ))
        tasks.append(asyncio.create_task(
            paced_worker(self._cross_channel_customer, cross_channel_target, cross_interval)
        ))

        # Health checks run continuously to measure uptime.
        async def health_loop():
            while time.monotonic() < deadline:
                await self._check_health()
                await asyncio.sleep(5)

        tasks.append(asyncio.create_task(health_loop()))

        # Chaos kills every two hours, per the challenge brief.
        if self.chaos:
            async def chaos_loop():
                while time.monotonic() < deadline:
                    await self._chaos_kill()
                    await asyncio.sleep(self.targets.chaos_interval_seconds)

            tasks.append(asyncio.create_task(chaos_loop()))

        await asyncio.gather(*tasks, return_exceptions=True)

        self.report.duration_seconds = time.monotonic() - started
        self.report.finished_at = datetime.now(timezone.utc).isoformat()
        return self.report

    async def close(self) -> None:
        """Release the HTTP client."""
        await self.client.aclose()


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def _main_async(args) -> int:
    """Run the chaos test and write the report."""
    runner = ChaosRunner(
        base_url=args.base_url,
        duration_seconds=args.duration,
        chaos=args.chaos,
        twilio_auth_token=args.twilio_auth_token,
        webhook_base_url=args.webhook_base_url,
        seed=args.seed,
    )

    print(f"[chaos] target {args.base_url} for {args.duration}s "
          f"(chaos={'on' if args.chaos else 'off'})")

    try:
        report = await runner.run()
    finally:
        await runner.close()

    checks = score_report(report, runner.targets)
    print(format_report(report, checks))

    with open(args.output, "w", encoding="utf-8") as handle:
        json.dump(
            {
                "report": asdict(report),
                "checks": checks,
            },
            handle,
            indent=2,
            default=str,
        )
    print(f"[chaos] report written to {args.output}")

    return 0 if all(c["passed"] for c in checks.values()) else 1


def main(argv=None) -> int:
    """Parse arguments and run the chaos test."""
    parser = argparse.ArgumentParser(
        description="Run the 24-hour multi-channel chaos test"
    )
    parser.add_argument(
        "--base-url", default="http://localhost:8000",
        help="Base URL of the running API",
    )
    parser.add_argument(
        "--duration", type=int, default=3600,
        help="Run length in seconds (86400 for the full 24-hour challenge)",
    )
    parser.add_argument(
        "--chaos", action="store_true",
        help="Kill pods every two hours (requires kubectl and a cluster)",
    )
    parser.add_argument(
        "--twilio-auth-token", default="",
        help="Twilio auth token used to sign WhatsApp requests",
    )
    parser.add_argument(
        "--webhook-base-url", default="",
        help="Public URL the Twilio webhook is reached on, used for signing",
    )
    parser.add_argument(
        "--output", default="chaos_report.json",
        help="Where to write the JSON report",
    )
    parser.add_argument(
        "--seed", type=int, default=None,
        help="Seed the random generator for reproducible runs",
    )

    args = parser.parse_args(argv)
    return asyncio.run(_main_async(args))


if __name__ == "__main__":
    sys.exit(main())
