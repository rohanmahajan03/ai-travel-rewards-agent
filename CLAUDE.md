# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

An autonomous AI agent that discovers travel reward opportunities (transfer bonuses, award availability, redemption value) across programs like Chase Ultimate Rewards, Amex Membership Rewards, and Bilt Rewards, and proactively surfaces the highest-value recommendations to users. Not a chatbot — the long-term vision is a system that runs on a schedule, reasons about tradeoffs, and decides on its own when a recommendation is worth notifying the user about.

The project is currently in **early scaffolding** — see "Repository status" below before assuming any module is implemented.

## Commands

### Backend (Python / FastAPI, in `backend/`)

```bash
pip install -e .              # install backend deps (from backend/pyproject.toml)
uvicorn app.main:app --reload # run the API locally on :8000
curl localhost:8000/health    # health check
```

There is no test runner configured yet (`backend/tests/` exists but is empty, and no pytest config/dependency has been added).

### Frontend (React + Vite, in `frontend/`)

```bash
npm install
npm run dev       # Vite dev server on :5173
npm run build
npm run preview
```

### Full stack (Postgres + Redis + backend + frontend)

```bash
cd infra
docker compose up --build
```

This starts `postgres` (:5432), `redis` (:6379), `backend` (:8000, FastAPI/uvicorn), and `frontend` (:5173, Vite dev server). Backend and frontend source directories are bind-mounted into their containers, so local edits are picked up without rebuilding. `backend/.env.example` is currently loaded directly as the backend's env file — copy it to `.env` and adjust before this is used beyond local dev.

## Architecture

The core design principle: **reasoning is separated from execution**. The AI planner decides *what to investigate next*; it never calls external services, writes to the database, or performs scoring directly. All of that goes through deterministic backend code that validates every action.

### Daily flow

1. **`app/workers/scheduler.py`** wakes up on a schedule and drives **`app/workers/jobs.py`**, which orchestrates every step below.
2. **`app/sync/`** — one module per reward program (`chase.py`, `amex.py`, `bilt.py`), each implementing the common interface in `sync/base.py`. Pulls transfer bonuses/promotions and normalizes them.
3. Normalized bonuses are persisted via **`app/db/models/`**.
4. **`app/agent/context.py`** assembles a planning context (the new bonus, the user's travel profile, a search budget, the allowed tool list from `tools/registry.py`) and hands it to **`app/agent/planner.py`**.
5. **`app/agent/planner.py`** is the only place an LLM call happens for search strategy. It never touches the network — it returns structured tool-call objects (`app/agent/schemas.py`), e.g. `{"tool": "search_awards", "arguments": {...}}`.
6. **`app/tools/executor.py`** is the trust boundary: it validates the planner's proposed call against `tools/registry.py` (supported program/airport, budget remaining, auth, rate limiting, retries, logging) before invoking the actual external service in a file like `tools/search_awards.py`.
7. Results become observations fed back into the planner, which can adapt its strategy (expand dates, try another city, relax cabin class, pivot regions) — this observe → reason → act loop continues until the planner has nothing left to try or the search budget in `agent/context.py` is exhausted.
8. Every candidate itinerary — not just the winner — is scored deterministically in **`app/scoring/`**: `cpp.py` (cents-per-point math), `ranking.py` (recommendation score), `validation.py` (consistency checks, dedup). None of this is delegated to the LLM.
9. The planner is called once more, on already-scored data, purely to generate a human-readable explanation of *why* a recommendation is compelling — it does not invent the score.
10. **`app/notifications/policy.py`** is the last deterministic gate (dedup, minimum score threshold, frequency limits, user preferences) before anything reaches a channel in `notifications/channels/`.

### Why this separation

- Deterministic calculations (CPP, scoring) are never delegated to the LLM.
- The AI cannot make arbitrary API calls or exceed the search budget — `tools/executor.py` enforces this.
- Every planned action and executed tool call is logged and replayable.
- New reward programs or tools can be added (new file in `sync/` or `tools/`) without changing the planner's reasoning process.

### Directory map

- `backend/app/api/` — FastAPI routers (HTTP layer only, no business logic)
- `backend/app/core/` — config, security, shared dependencies
- `backend/app/db/` — SQLAlchemy models, session, Alembic migrations
- `backend/app/sync/` — per-reward-program ingestion
- `backend/app/agent/` — the planner; produces structured tool calls and explanations only
- `backend/app/tools/` — validated execution of external services (the only place the planner's output actually runs)
- `backend/app/scoring/` — deterministic CPP/ranking/validation
- `backend/app/notifications/` — deterministic notification policy + delivery channels
- `backend/app/workers/` — scheduler entrypoint and job orchestration tying the above together
- `frontend/src/` — React (Vite) dashboard; `components/` and `lib/` are currently empty
- `infra/` — `docker-compose.yml` for local dev, `deploy/` for deployment config (not yet populated)
- `docs/architecture/` — intended home for architecture diagrams (not yet populated)

## Repository status

Most backend modules under `app/` (agent, tools, scoring, notifications, sync, workers, api, core, db) currently contain only empty placeholder files — the directory structure above is scaffolding, not implementation. `backend/app/main.py` has a minimal working FastAPI app with a `/health` route. The frontend has a minimal working React entry point (`App.tsx` renders a heading) but no real pages/components yet.
