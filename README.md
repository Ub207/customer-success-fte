# CRM Digital FTE Factory

> Production-grade customer-success AI agent that autonomously handles support across **Email, WhatsApp, and a Web Form**. Built during Hackathon 5. Final deliverable: FastAPI + OpenAI Agents SDK + Kafka + PostgreSQL/pgvector + Docker/Kubernetes.

---

## Quick Start

```bash
git clone https://github.com/Ub207/-customer-success-fte.git
cd customer-success-fte
```

Create your secrets file (gitignored, never commit it):

```bash
# production/.env  -- needs: one LLM key + provider URLs
# GEMINI_API_KEY=...   (free)  |  GROQ_API_KEY=...  (free)  |  OPENAI_API_KEY=...  (paid)
# DATABASE_URL=postgresql://...
# KAFKA_BOOTSTRAP_SERVERS=... , KAFKA_SASL_USERNAME=... , KAFKA_SASL_PASSWORD=...
```

Install Python deps and run the API:

```bash
cd production
python -m venv venv
venv/Scripts/activate            # Windows
pip install -r requirements.txt
uvicorn production.api.main:app --reload --port 8000
```

Verify:

```bash
curl http://localhost:8000/health
```

Start the web form (Next.js 14):

```bash
cd production/web-form && npm install && npm run dev
```

The full local stack also runs with Docker Compose: `cd production && docker compose up -d`.

---

## What It Does

A single AI agent receives customer messages from three channels, uses five ordered tools - always starting with `create_ticket`, ending with `send_response` - and resolves issues end-to-end without human intervention. Cross-channel conversation memory, semantic knowledge-base search, smart escalation routing with SLA enforcement, and daily sentiment reporting.

| Channel | Inbound | Outbound |
|---------|---------|----------|
| Email | Gmail Pub/Sub webhook | Agent reply via response-delivery worker |
| WhatsApp | Twilio webhook | Twilio Messaging API |
| Web Form | React `<SupportForm>` widget | Next.js dashboards (web / WhatsApp / Gmail) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Agent | OpenAI Agents SDK (GPT-4o / Groq / Gemini, lazy provider selection) |
| API | FastAPI, async Python 3.11 |
| Database | PostgreSQL 15 + pgvector |
| Message queue | Apache Kafka (aiokafka) / Redpanda Cloud |
| Email | Gmail API + Google Cloud Pub/Sub |
| WhatsApp | Twilio Messaging API |
| Web form | Next.js 14 + React + Tailwind CSS |
| Deployment | Docker + Kubernetes (HPA auto-scales 2 -> 10 pods at 70% CPU) |
| Logging | structlog (structured JSON) |
| Tests | pytest (DB/Kafka mocked) + Locust load testing |

---

## Project Layout

```
customer-success-fte/
|-- README.md                   # this file
|-- .gitignore                  # home-dir safe: tracks only Desktop/hackathon-5
`-- Desktop/hackathon-5/        # the actual project
    |-- context/                # agent knowledge: brand voice, escalation rules, product docs
    |-- src/                    # Stage 1 - MCP prototype (Claude Desktop)
    |-- specs/                  # design & planning docs
    |-- production/             # Stage 2 - production system
    |   |-- agent/              # 5 @function_tool definitions + system prompt v5
    |   |-- api/                # FastAPI app, REST endpoints
    |   |-- channels/           # gmail / whatsapp / web_form handlers
    |   |-- workers/            # Kafka consumers: message processor, delivery, daily report
    |   |-- database/           # schema.sql + queries
    |   |-- k8s/                # manifests: deployments, HPA, secrets, ServiceMonitor
    |   `-- web-form/           # Next.js dashboard + embeddable SupportForm.jsx
    `-- tests/                  # pytest suite
```

Full documentation: [`Desktop/hackathon-5/README.md`](Desktop/hackathon-5/README.md)

---

## The Five Agent Tools

Called in this order, enforced by the system prompt and the test suite:

| # | Tool | Purpose |
|---|------|---------|
| 1 | `create_ticket` | Log the interaction first - always |
| 2 | `get_customer_history` | Retrieve prior interactions across all channels |
| 3 | `search_knowledge_base` | Semantic search over product docs (pgvector) |
| 4 | `escalate_to_human` | Route to the right team with an SLA |
| 5 | `send_response` | Deliver the reply - must always be last |

Escalation reason codes map to a routed team and an SLA inside `escalate_to_human` (for example `legal_threat` -> 1 hour, `knowledge_gap` -> 8 hours).

---

## Tests

```bash
cd Desktop/hackathon-5
production/venv/Scripts/python.exe -m pytest -q
```

The suite runs with no live services - the database and Kafka client are mocked. Load testing uses Locust:

```bash
locust -f production/tests/load_test.py --host=http://localhost:8000
```

---

## Repository State

This repository lives inside your home directory, which is unusual: `.gitignore` ignores **everything** by default and re-includes only `Desktop/hackathon-5`. That prevents accidentally staging secrets (`.env`, `venv/`, `node_modules/`) into a public remote.

The root tree is not directly writable from every shell, so `git status` may report a permission error when run against the repo root from a restricted environment. Check for uncommitted changes under `Desktop/hackathon-5/`.

---

## Contributing

1. Run the test suite to confirm nothing broke.
2. Commit only to `main`.
3. Do not stage personal editor or tool config files - keep them ignored.
4. Never commit `production/.env` or any real API key.

---

**Hackathon 5 - CRM Digital FTE Factory**
*TechCorp SaaS - Multi-channel AI Customer Success Agent - OpenAI Agents SDK + FastAPI + Kafka + PostgreSQL/pgvector*
