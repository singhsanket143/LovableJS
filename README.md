# LovableJS (Vibe)

Chat-driven app builder: a **Vite + React** client talks to an **Express** API, which starts **Temporal** workflows. A worker runs planner → designer → builder → reviewer agents and provisions an **E2B** sandbox for live previews.

## Prerequisites

- **Node.js** 20+ and **npm**
- **Docker** (Postgres + Temporal via Compose)
- **OpenAI API key** ([platform.openai.com](https://platform.openai.com/))
- **E2B API key** ([e2b.dev](https://e2b.dev/)) — sandboxes compile and serve generated apps

## 1. Install dependencies

From the repo root:

```bash
npm install
```

This installs the root workspace plus `server` and `client`.

## 2. Configure environment

Copy the example env file and add your keys:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for all agents |
| `E2B_API_KEY` | Required for sandbox create / preview compile |
| `DATABASE_URL` | Default matches Docker Postgres below |
| `API_PORT` | API port (default `3000`) |
| `TEMPORAL_ADDRESS` | Default `127.0.0.1:7233` |
| `TEMPORAL_TASK_QUEUE` | Default `coding-agent` |

Optional model overrides are listed in `.env.example` (`OPENAI_PLANNING_MODEL`, `OPENAI_BUILDER_MODEL`, etc.).

## 3. Start infrastructure (Postgres + Temporal)

```bash
npm run docker:up
```

This starts:

| Service | URL |
|---------|-----|
| Postgres (app DB) | `localhost:5432` — user `vibe`, password `vibe`, database `lovablejs` |
| Temporal gRPC | `127.0.0.1:7233` |
| Temporal Web UI | [http://127.0.0.1:8233](http://127.0.0.1:8233) |

Stop with `npm run docker:down`. Logs: `npm run docker:logs`.

## 4. Database schema

With Postgres running, apply migrations and generate the Prisma client:

```bash
cd server
npx prisma migrate deploy
npx prisma generate
cd ..
```

For local development on a fresh DB you can use `npx prisma migrate dev` instead of `deploy` (interactive).

## 5. Run the full stack

One command starts **client**, **API**, and **Temporal worker**:

```bash
npm run dev:all
```

| Process | URL |
|---------|-----|
| **UI (use this)** | [http://127.0.0.1:43123](http://127.0.0.1:43123) |
| API | [http://127.0.0.1:3000](http://127.0.0.1:3000) — health: `/api/health` |
| Vite proxy | `/api/*` on the UI port forwards to the API |

Run pieces separately if you prefer:

```bash
npm run dev:client    # UI only
npm run dev           # API only
npm run dev:worker    # Temporal worker only
npm run dev:server    # API + worker (no UI)
```

## 6. End-to-end usage

1. Open **http://127.0.0.1:43123**.
2. Enter a prompt (or pick a template) and submit — a new **project** is created and a workflow starts.
3. You are taken to the project page. The chat **polls every second**:
   - **Plan** messages show todo progress from the agent pipeline.
   - When the run finishes, an assistant message includes a **Preview** card.
4. Select **Preview** (right pane) to load the compiled app in an iframe (`/api/preview/:projectId`).
5. Switch to **Code** to browse generated files from the latest fragment.
6. Send another message in the chat to start a **new workflow** on the same project (iteration).

If the UI shows “Could not load projects” or messages fail, confirm the API is on port `3000` (or update `client/vite.config.ts` proxy target to match `API_PORT`).

## Architecture (short)

```
Browser (client :43123)
    → /api/* proxy → Express (:3000)
        → Prisma → Postgres
        → Temporal client → codeAgentWorkflow
Temporal worker
    → activities: sandbox, planner, designer, builder, reviewer, saveResult
    → E2B sandbox + OpenAI
```

Workflow IDs appear in Temporal UI under namespace `default`, task queue `coding-agent`.

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Workflow never completes | Worker running? `npm run dev:worker` or use `dev:all`. Temporal UI for failed activities. |
| Sandbox / preview errors | Valid `E2B_API_KEY` in `server/.env`. |
| Agent errors | Valid `OPENAI_API_KEY` and model names your account supports. |
| DB connection refused | `npm run docker:up` and `DATABASE_URL` matches Compose. |
| Migrations out of date | `cd server && npx prisma migrate deploy && npx prisma generate` |

## Project layout

```
client/          React UI (Vite)
server/          Express API, agents, Temporal worker, Prisma
docker/          Postgres init (Temporal DBs)
docker-compose.yml
```
