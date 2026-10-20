"""
Tests for the 24-hour chaos test harness.

The harness scores a live run against the challenge targets, so the scoring
logic is what decides whether a run passed. These tests cover the scoring
and the report maths without needing a live API.
"""

import pytest


# ---------------------------------------------------------------------------
# Percentiles
# ---------------------------------------------------------------------------

class TestPercentiles:
    """Latency percentiles must be computed the way the targets expect."""

    def test_p95_of_known_values(self):
        """P95 of 1..100 is the 95th value."""
        from production.tests.chaos_test import ChannelResult

        result = ChannelResult(latencies=[float(i) for i in range(1, 101)])

        assert result.p95_latency == pytest.approx(95.0)

    def test_p95_with_no_data_is_zero(self):
        """No traffic means no latency to report."""
        from production.tests.chaos_test import ChannelResult

        assert ChannelResult().p95_latency == 0.0

    def test_p95_with_a_single_sample(self):
        """One sample is its own percentile."""
        from production.tests.chaos_test import ChannelResult

        assert ChannelResult(latencies=[1.5]).p95_latency == 1.5

    def test_p95_ignores_outlier_ordering(self):
        """The percentile must not depend on arrival order."""
        from production.tests.chaos_test import ChannelResult

        ordered = ChannelResult(latencies=[float(i) for i in range(1, 21)])
        shuffled = ChannelResult(latencies=[float(i) for i in range(20, 0, -1)])

        assert ordered.p95_latency == shuffled.p95_latency


# ---------------------------------------------------------------------------
# Rates
# ---------------------------------------------------------------------------

class TestRates:
    """Uptime and escalation rates must be computed correctly."""

    def test_uptime_percent(self):
        """Uptime is the share of successful health checks."""
        from production.tests.chaos_test import Report

        report = Report(health_checks=1000, health_failures=1)

        assert report.uptime_percent == pytest.approx(99.9)

    def test_uptime_with_no_checks_is_zero(self):
        """No probes means no uptime to claim."""
        from production.tests.chaos_test import Report

        assert Report().uptime_percent == 0.0

    def test_escalation_rate(self):
        """Escalation rate is a share of successful requests."""
        from production.tests.chaos_test import ChannelResult

        result = ChannelResult(succeeded=100, escalated=20)

        assert result.escalation_rate == pytest.approx(20.0)

    def test_escalation_rate_with_no_successes_is_zero(self):
        """Failed requests cannot escalate."""
        from production.tests.chaos_test import ChannelResult

        result = ChannelResult(succeeded=0, escalated=5)

        assert result.escalation_rate == 0.0

    def test_cross_channel_identification_percent(self):
        """The cross-channel rate is a share of attempts."""
        from production.tests.chaos_test import Report

        report = Report(
            cross_channel_attempts=20, cross_channel_identified=19
        )

        assert report.cross_channel_identification_percent == pytest.approx(95.0)

    def test_report_p95_spans_all_channels(self):
        """The overall P95 must include every channel's latencies."""
        from production.tests.chaos_test import ChannelResult, Report

        report = Report(channels={
            "web_form": ChannelResult(latencies=[1.0, 2.0, 3.0]),
            "email": ChannelResult(latencies=[4.0, 5.0]),
        })

        assert report.p95_latency == pytest.approx(5.0)


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

class TestScoreReport:
    """The scoring decides whether a challenge run passed."""

    def _passing_report(self):
        """A report that meets every target."""
        from production.tests.chaos_test import ChannelResult, Report

        return Report(
            channels={
                "web_form": ChannelResult(
                    submitted=120, succeeded=118, latencies=[0.5] * 100
                ),
                "email": ChannelResult(submitted=60, succeeded=60),
                "whatsapp": ChannelResult(submitted=60, succeeded=60),
            },
            health_checks=10000,
            health_failures=2,
            cross_channel_attempts=12,
            cross_channel_identified=12,
            lost_messages=0,
        )

    def test_a_passing_run_passes_every_check(self):
        """A report meeting all targets must score clean."""
        from production.tests.chaos_test import Targets, score_report

        checks = score_report(self._passing_report(), Targets())

        assert all(c["passed"] for c in checks.values()), [
            name for name, c in checks.items() if not c["passed"]
        ]

    def test_too_few_web_form_submissions_fails(self):
        """The web form volume target is enforced."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.channels["web_form"].submitted = 10

        checks = score_report(report, Targets())

        assert checks["web_form_submissions"]["passed"] is False

    def test_low_uptime_fails(self):
        """Uptime below the target fails the run."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.health_failures = 100

        checks = score_report(report, Targets())

        assert checks["uptime_percent"]["passed"] is False

    def test_slow_p95_fails(self):
        """P95 above three seconds fails the run."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.channels["web_form"].latencies = [9.0] * 100

        checks = score_report(report, Targets())

        assert checks["p95_latency_seconds"]["passed"] is False

    def test_high_escalation_rate_fails(self):
        """An escalation rate above a quarter fails the run."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.channels["web_form"].escalated = 60

        checks = score_report(report, Targets())

        assert checks["escalation_rate_percent"]["passed"] is False

    def test_message_loss_fails(self):
        """Any lost message fails the run."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.lost_messages = 1

        checks = score_report(report, Targets())

        assert checks["no_message_loss"]["passed"] is False

    def test_low_cross_channel_identification_fails(self):
        """Poor customer matching fails the run."""
        from production.tests.chaos_test import Report, Targets, score_report

        report = self._passing_report()
        report.cross_channel_identified = 5

        checks = score_report(report, Targets())

        assert checks["cross_channel_identification_percent"]["passed"] is False

    def test_targets_cover_every_requirement(self):
        """Every challenge target must be scored."""
        from production.tests.chaos_test import score_report

        checks = score_report(self._passing_report(), __import__(
            "production.tests.chaos_test", fromlist=["Targets"]
        ).Targets())

        expected = {
            "web_form_submissions",
            "email_messages",
            "whatsapp_messages",
            "cross_channel_customers",
            "uptime_percent",
            "p95_latency_seconds",
            "escalation_rate_percent",
            "cross_channel_identification_percent",
            "no_message_loss",
        }

        assert set(checks.keys()) == expected

    def test_chaos_interval_is_two_hours(self):
        """The brief specifies a pod kill every two hours."""
        from production.tests.chaos_test import Targets

        assert Targets().chaos_interval_seconds == 2 * 60 * 60


# ---------------------------------------------------------------------------
# Reporting
# ---------------------------------------------------------------------------

class TestFormatReport:
    """The report must show every check and its result."""

    def test_report_lists_all_checks(self):
        """Every scored check appears in the rendered summary."""
        from production.tests.chaos_test import (
            Report, Targets, format_report, score_report,
        )

        report = Report(
            channels={
                "web_form": __import__(
                    "production.tests.chaos_test", fromlist=["ChannelResult"]
                ).ChannelResult(submitted=120, succeeded=120),
            },
            health_checks=100,
            health_failures=0,
        )
        checks = score_report(report, Targets())
        text = format_report(report, checks)

        for name in checks:
            assert name in text

    def test_report_shows_pass_and_fail(self):
        """Both outcomes are visible in the summary."""
        from production.tests.chaos_test import (
            Report, Targets, format_report, score_report,
        )

        report = Report(
            channels={
                "web_form": __import__(
                    "production.tests.chaos_test", fromlist=["ChannelResult"]
                ).ChannelResult(submitted=1, succeeded=1),
            },
            health_checks=100,
            health_failures=50,
        )
        text = format_report(report, score_report(report, Targets()))

        assert "PASS" in text
        assert "FAIL" in text


# ---------------------------------------------------------------------------
# Chaos honesty
# ---------------------------------------------------------------------------

class TestChaosIsHonest:
    """A run must never claim chaos it did not perform."""

    @pytest.mark.asyncio
    async def test_missing_kubectl_is_a_failed_kill(self, monkeypatch):
        """Without kubectl no pod is killed, and that is recorded as a failure."""
        from production.tests.chaos_test import ChaosRunner

        runner = ChaosRunner(
            base_url="http://localhost:8000",
            duration_seconds=1,
        )
        monkeypatch.setattr("shutil.which", lambda name: None)

        await runner._chaos_kill()

        assert runner.report.chaos_kills == 0
        assert runner.report.chaos_kill_failures == 1
        assert any("kubectl" in e for e in runner.report.errors)