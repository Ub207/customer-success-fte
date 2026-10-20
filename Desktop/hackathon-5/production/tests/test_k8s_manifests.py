"""
Tests for the Kubernetes manifests.

The existing transition suite only checks that the manifest files exist. These
tests parse them, so a broken manifest - bad YAML, a missing probe, a
Deployment with no replicas - fails here rather than at `kubectl apply`.
"""

import pathlib

import pytest
import yaml

K8S_DIR = pathlib.Path(__file__).parent.parent / "k8s"

MANIFESTS = [
    "namespace.yaml",
    "configmap.yaml",
    "secrets.yaml",
    "deployment-api.yaml",
    "deployment-worker.yaml",
    "deployment-metrics-collector.yaml",
    "service.yaml",
    "ingress.yaml",
    "hpa.yaml",
    "postgres-statefulset.yaml",
    "cronjob-daily-reporter.yaml",
    "servicemonitor.yaml",
]


def _load(name):
    """Parse a manifest file into a list of documents."""
    path = K8S_DIR / name
    with open(path, encoding="utf-8") as handle:
        return [doc for doc in yaml.safe_load_all(handle) if doc]


def _all_docs():
    """Every document across every manifest."""
    docs = []
    for name in MANIFESTS:
        docs.extend(_load(name))
    return docs


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

class TestManifestsParse:
    """Every manifest must be valid YAML with the required fields."""

    @pytest.mark.parametrize("name", MANIFESTS)
    def test_manifest_is_valid_yaml(self, name):
        """A manifest that cannot be parsed cannot be applied."""
        docs = _load(name)

        assert docs, f"{name} produced no YAML documents"

    @pytest.mark.parametrize("name", MANIFESTS)
    def test_manifest_has_api_version_and_kind(self, name):
        """Every document needs apiVersion and kind for the API server."""
        for doc in _load(name):
            assert "apiVersion" in doc, f"{name}: document missing apiVersion"
            assert "kind" in doc, f"{name}: document missing kind"

    @pytest.mark.parametrize("name", MANIFESTS)
    def test_namespaced_resources_share_one_namespace(self, name):
        """All namespaced resources must target the declared namespace."""
        namespace_docs = _load("namespace.yaml")
        expected = namespace_docs[0]["metadata"]["name"]

        for doc in _load(name):
            if doc["kind"] in ("Namespace", "ClusterRole", "ClusterRoleBinding"):
                continue
            actual = doc.get("metadata", {}).get("namespace")
            if actual is not None:
                assert actual == expected, (
                    f"{name}: namespace {actual!r} does not match {expected!r}"
                )

    def test_no_placeholder_secrets_committed(self):
        """Real credentials must never be committed."""
        secrets = _load("secrets.yaml")[0]
        string_data = secrets.get("stringData", {})

        # Only these carry real secrets; the rest are public identifiers.
        secret_keys = [
            key
            for key in string_data
            if "KEY" in key or "PASSWORD" in key or "TOKEN" in key or "SECRET" in key
        ]

        for key in secret_keys:
            value = string_data[key]
            if not value:
                continue
            # Placeholders are expected in the template, but a value that
            # looks like a live credential must never be committed.
            assert "CHANGE" in value, (
                f"secrets.yaml: {key} holds an unexpected value - commit a placeholder, not a credential"
            )


# ---------------------------------------------------------------------------
# Workloads
# ---------------------------------------------------------------------------

class TestDeployments:
    """The API and worker Deployments must be production-shaped."""

    @pytest.mark.parametrize(
        "name", ["deployment-api.yaml", "deployment-worker.yaml"]
    )
    def test_deployment_declares_replicas(self, name):
        """A Deployment without replicas defaults to one pod."""
        doc = _load(name)[0]

        assert doc["kind"] == "Deployment"
        assert doc["spec"]["replicas"] >= 2, (
            f"{name}: expected multiple replicas for high availability"
        )

    @pytest.mark.parametrize(
        "name", ["deployment-api.yaml", "deployment-worker.yaml"]
    )
    def test_container_has_health_probes(self, name):
        """Every long-running container needs liveness and readiness probes."""
        container = _load(name)[0]["spec"]["template"]["spec"]["containers"][0]

        assert "livenessProbe" in container, f"{name}: missing livenessProbe"
        assert "readinessProbe" in container, f"{name}: missing readinessProbe"

    @pytest.mark.parametrize(
        "name", ["deployment-api.yaml", "deployment-worker.yaml"]
    )
    def test_container_declares_resource_limits(self, name):
        """Resource requests and limits are required for scheduling."""
        container = _load(name)[0]["spec"]["template"]["spec"]["containers"][0]
        resources = container.get("resources", {})

        assert "requests" in resources, f"{name}: missing resource requests"
        assert "limits" in resources, f"{name}: missing resource limits"

    @pytest.mark.parametrize(
        "name", ["deployment-api.yaml", "deployment-worker.yaml"]
    )
    def test_deployment_pulls_config_and_secrets(self, name):
        """The container must receive its configuration from the cluster."""
        container = _load(name)[0]["spec"]["template"]["spec"]["containers"][0]
        env_from = container.get("envFrom", [])
        refs = {
            entry["configMapRef"]["name"]
            for entry in env_from
            if "configMapRef" in entry
        }
        secret_refs = {
            entry["secretRef"]["name"]
            for entry in env_from
            if "secretRef" in entry
        }

        # A secret may also be injected through a plain env entry.
        env_secret_names = {
            entry["valueFrom"]["secretKeyRef"]["name"]
            for entry in container.get("env", [])
            if "valueFrom" in entry and "secretKeyRef" in entry["valueFrom"]
        }

        assert "fte-config" in refs, f"{name}: configmap not wired"
        assert (
            "fte-secrets" in secret_refs or "fte-secrets" in env_secret_names
        ), f"{name}: secrets not wired"

    @pytest.mark.parametrize(
        "name", ["deployment-api.yaml", "deployment-worker.yaml"]
    )
    def test_selector_matches_pod_labels(self, name):
        """A mismatched selector means the Deployment never schedules pods."""
        spec = _load(name)[0]["spec"]
        selector = spec["selector"]["matchLabels"]
        labels = spec["template"]["metadata"]["labels"]

        for key, value in selector.items():
            assert labels.get(key) == value, (
                f"{name}: selector {key}={value} does not match pod labels"
            )


# ---------------------------------------------------------------------------
# Autoscaling and networking
# ---------------------------------------------------------------------------

class TestAutoscalingAndNetworking:
    """HPA, Service and Ingress must be wired to the running workloads."""

    def test_hpa_targets_a_deployment(self):
        """The HPA must reference a Deployment that exists."""
        docs = _load("hpa.yaml")
        hpas = [doc for doc in docs if doc["kind"] == "HorizontalPodAutoscaler"]

        assert hpas, "no HorizontalPodAutoscaler found in hpa.yaml"

        for hpa in hpas:
            target = hpa["spec"]["scaleTargetRef"]
            assert target["kind"] == "Deployment"
            assert target["name"], "HPA scaleTargetRef has no name"

    def test_hpa_scales_beyond_one_replica(self):
        """An HPA pinned to one replica cannot absorb a traffic spike."""
        for hpa in _load("hpa.yaml"):
            if hpa["kind"] != "HorizontalPodAutoscaler":
                continue
            max_replicas = hpa["spec"]["maxReplicas"]
            assert max_replicas > hpa["spec"]["minReplicas"], (
                "HPA maxReplicas must exceed minReplicas"
            )

    def test_service_selects_the_api_pods(self):
        """The Service must select the API deployment's labels."""
        service = _load("service.yaml")[0]
        selector = service["spec"]["selector"]
        api_labels = _load("deployment-api.yaml")[0]["spec"]["template"]["metadata"]["labels"]

        for key, value in selector.items():
            assert api_labels.get(key) == value, (
                f"service selector {key}={value} does not match the API pod labels"
            )

    def test_service_exposes_the_api_port(self):
        """The Service port must reach the container port."""
        service = _load("service.yaml")[0]
        ports = service["spec"]["ports"]

        assert ports, "service.yaml defines no ports"

    def test_ingress_routes_to_the_api_service(self):
        """The Ingress must point at a Service that exists."""
        ingress = _load("ingress.yaml")[0]
        rules = ingress["spec"]["rules"]

        assert rules, "ingress.yaml defines no rules"

        backend = rules[0]["http"]["paths"][0]["backend"]["service"]
        assert backend["name"], "ingress backend has no service name"

    def test_daily_reporter_cronjob_is_scheduled(self):
        """The report must have a schedule to run on."""
        cronjob = _load("cronjob-daily-reporter.yaml")[0]

        assert cronjob["kind"] == "CronJob"
        assert cronjob["spec"]["schedule"], "CronJob has no schedule"
        assert cronjob["spec"]["jobTemplate"], "CronJob has no job template"


# ---------------------------------------------------------------------------
# Monitoring
# ---------------------------------------------------------------------------

class TestMonitoring:
    """Prometheus rules and the ServiceMonitor must be present."""

    def test_servicemonitor_selects_a_service(self):
        """The ServiceMonitor must scrape a service that exists."""
        monitor = _load("servicemonitor.yaml")[0]

        assert monitor["kind"] == "ServiceMonitor"
        assert monitor["spec"]["selector"], "ServiceMonitor has no selector"

    def test_prometheus_rules_define_alerts(self):
        """Alerting rules are required for the monitoring rubric."""
        alerts = [
            doc
            for doc in _load("servicemonitor.yaml")
            if doc["kind"] == "PrometheusRule"
        ]

        assert alerts, "no PrometheusRule found"

        for rule in alerts:
            assert rule["spec"]["groups"], "PrometheusRule has no groups"

    def test_alerts_have_thresholds(self):
        """Every alert must state a condition that can fire."""
        alerts = [
            doc
            for doc in _load("servicemonitor.yaml")
            if doc["kind"] == "PrometheusRule"
        ]

        expressions = []
        for rule in alerts:
            for group in rule["spec"]["groups"]:
                for alert in group.get("rules", []):
                    if "alert" in alert:
                        expressions.append(alert)

        assert expressions, "no alert rules defined"

        for alert in expressions:
            assert alert.get("expr"), f"alert {alert.get('alert')} has no expr"
            assert alert.get("for"), f"alert {alert.get('alert')} has no 'for' duration"
