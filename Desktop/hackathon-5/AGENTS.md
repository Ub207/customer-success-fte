# Repository Guidelines

## Project Structure & Module Organization

The git repo root is `C:\Users\Hp` (home-dir rooted); all project content lives in `Desktop/hackathon-5/`.

```
context/            agent knowledge: brand voice, escalation rules, product docs
src/                Stage 1 MCP prototype (Claude Desktop)
specs/              design and planning documents
production/         Stage 2 production system
  agent/            5 @function_tool definitions + system prompt v5
  api/              FastAPI app and REST endpoints
  channels/         gmail / whatsapp / web_form inbound handlers
  workers/          Kafka consumers: message processor, delivery, daily report
  database/         schema.sql and queries.py
  k8s/              Kubernetes manifests
  web-form/         Next.js 14 dashboard + embeddable SupportForm.jsx
production/tests/   pytest suite
```

## Build, Test, and Development Commands

Run all commands from `Desktop/hackathon-5` — code imports as `production.*`.

```bash
production/venv/Scripts/python.exe -m pytest -q                    # full suite (81 tests)
production/venv/Scripts/python.exe -m pytest production/tests/test_agent.py -q
production/venv/Scripts/python.exe -m uvicorn production.api.main:app --port 8000
production/venv/Scripts/python.exe -m production.workers.message_processor
cd production/web-form && npm install && npm run dev                # Next.js on :3000
cd production && docker compose up -d                              # full local stack
```

## Coding Style & Naming Conventions

Python 3.11, async-first, 4-space indent, `snake_case` for functions and variables, `PascalCase` for classes and Pydantic models. Import as `from production.agent.tools import ...`. React components are `PascalCase.jsx` in `production/web-form/components/`. No linter or formatter is configured, so match surrounding style. Log with `structlog`, never `print`.

## Testing Guidelines

pytest with `asyncio_mode = auto` (`pytest.ini`). Files are `test_*.py`, classes `Test*`, functions `test_*`. Database and Kafka are mocked via `AsyncMock` fixtures, so tests need no live services. Add tests alongside any behavior change; the suite must stay at 100% passing.

## Commit & Pull Request Guidelines

History uses short imperative subjects, e.g. `Add design system for the web-form UI`, `Switch Groq provider to openai/gpt-oss-120b`. Keep commits focused, one logical change each. PRs should describe what changed and why, link the issue, list verification commands run, and include screenshots for any web-form change.

## Security & Agent Contract

Never commit `production/.env`, API keys, or `venv/`; the repo root `.gitignore` ignores everything except `Desktop/hackathon-5`. Stage explicit paths — never `git add -A` or `git add .`. The agent must call exactly five tools in order: `create_ticket`, `get_customer_history`, `search_knowledge_base`, `escalate_to_human`, `send_response`. Tests enforce this.
