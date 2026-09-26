# Deployment

MediZen is a FastAPI backend and a React (Vite) frontend.

| | Local | Production (Render) |
|---|---|---|
| SaaS portal (frontend) | `http://localhost:5173/` | `https://med-zen.onrender.com/` |
| FastAPI (API) | `http://127.0.0.1:8000/api` | `https://med-zen.onrender.com/api` |

Locally they run as two processes. On Render they run as **one** Web Service: FastAPI serves the API under `/api` and the built frontend (`frontend/dist`) at `/`, so both share one address and no CORS setup is needed.

Configuration comes from the `env/` folders (`backend/env/`, `frontend/env/`). The `backend/env/` files hold secrets (OpenAI key, demo password), so they are git-ignored and only exist on your machine; on Render you set those variables in the dashboard instead. The `frontend/env/` files hold only public URLs, so they are committed to git and the Render build reads them. See [Environment variables](#environment-variables).

---

## 1. Deploy locally (http://localhost:5173)

### Prerequisites

- Python 3.10+ and Node.js 18+
- `backend/env/local_dev.env` exists (copy `local_dev.env.example` and add your `OPENAI_API_KEY`). `frontend/env/local_dev.env` is already in git

### Step 1 — Start the backend (port 8000)

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows PowerShell: venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0   # loads env/local_dev.env by default
```

Check it: <http://127.0.0.1:8000/api/healthceck> should return `{"status":"ok","status_code":200,"env_name":"local_dev"}`. Interactive API docs are at <http://127.0.0.1:8000/docs>.

### Step 2 — Start the frontend (port 5173)

Pick one:

**Option A — dev server** (hot reload, best while developing):

```bash
cd frontend
npm install
npm run dev
```

**Option B — production build served on 5173** (closest to a real deployment):

```bash
cd frontend
npm install
npm run build:local                       # bakes in env/local_dev.env
npm run preview -- --port 5173 --strictPort
```

Open <http://localhost:5173>. The app calls the backend at `VITE_API_URL` (`http://127.0.0.1:8000/api`), so keep the backend from Step 1 running in its own terminal.

### Step 3 — Verify

1. <http://localhost:5173> loads the login page.
2. Log in with the demo credentials (`DEMO_USERNAME` / `DEMO_PASSWORD`, defaults in [backend/auth.py](../backend/auth.py)).
3. The menu and doctor filters load, and the chat agent answers.

To stop, press `Ctrl+C` in each terminal.

> Locally the frontend and backend are on different ports, so the browser applies CORS. [backend/main.py](../backend/main.py) allows `http://localhost:5173` and `http://127.0.0.1:5173`. If you serve the frontend on another port or host, add it there.

> If `frontend/dist` exists, FastAPI also serves it at <http://127.0.0.1:8000/>. That is what happens on Render. Locally, use port 5173 as above and ignore it.

---

## 2. Deploy on Render (https://med-zen.onrender.com)

One Web Service, created from the GitHub repo (`pandeydevendra/med_zen`). It builds the frontend, then starts FastAPI, which serves both.

| Setting | Value |
|---|---|
| Root Directory | *(leave empty — repo root)* |
| Runtime | Python 3 |
| Build Command | `pip install -r backend/requirements.txt && cd frontend && npm install && npm run build` |
| Start Command | `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/api/healthceck` |

Environment variables (Render dashboard → Environment). The `VITE_*` values are read during the build:

| Key | Value |
|---|---|
| `ENV_NAME` | `prod` |
| `OPENAI_API_KEY` | your OpenAI key |
| `DEMO_USERNAME` | a login name of your choice |
| `DEMO_PASSWORD` | a strong password |
| `JWT_SECRET` | a long random secret, different from your local one |
| `DB_HOST` | your production MySQL host |
| `DB_PORT` | your production MySQL port — **check this explicitly**; managed providers (Aiven, PlanetScale, ...) assign a random non-`3306` port per service, shown on their connection-info page. Defaults to `3306` if unset, which is wrong for most of them. |
| `DB_USER` | your production MySQL user |
| `DB_PASSWORD` | your production MySQL password |
| `DB_NAME` | `med_zen` |
| `VITE_ENV_NAME` | `prod` |
| `VITE_API_URL` | `https://med-zen.onrender.com/api` |
| `VITE_SAAS_URL` | `https://med-zen.onrender.com` |

Set `DEMO_USERNAME` and `DEMO_PASSWORD` for anything reachable from the internet. Without them the demo defaults from the source code apply.

Render does not provide MySQL itself (only Postgres) — `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD` must point at a MySQL instance reachable from the internet (e.g. PlanetScale, Railway, Aiven, AWS RDS). Run [docs/mysql_scrpt.sql](mysql_scrpt.sql) against it once before first use — see [Database setup](#database-setup) below. Without `DB_HOST` set, any DB-backed request (login, ops onboarding) crashes with `KeyError: 'DB_HOST'` — [db.py](../backend/db.py) reads these vars lazily, so the app still boots and non-DB routes still work, but the first DB touch fails hard. With the wrong `DB_PORT`, it instead hangs and times out (`mysql.connector.errors.ConnectionTimeoutError`) rather than failing fast, since nothing is listening on the wrong port to reject the connection quickly.

`frontend/env/prod.env` is committed, so the Render build gets the `VITE_*` values from it even without dashboard entries (a variable set in the dashboard still wins). `backend/env/prod.env` is not in git, so the backend uses the dashboard variables. `npm run build` uses the `prod` mode.

### Verify

1. <https://med-zen.onrender.com/> shows the portal login page.
2. <https://med-zen.onrender.com/api/healthceck> returns `{"status":"ok","status_code":200,"env_name":"prod"}` (`env_name` shows which environment the backend is running, and `urls` lists every API endpoint).
3. <https://med-zen.onrender.com/docs> shows the API docs.
4. Log in and use the app. Calls go to `https://med-zen.onrender.com/api/v1/...`.

### Notes

- The `VITE_*` values are baked in at build time, so trigger a new deploy after changing them. If `VITE_API_URL` is missing, a production build falls back to the same-origin `/api`, and a dev build to `http://localhost:8000/api`.
- The build needs both Python and Node.js. If the build fails with `npm: command not found`, add a Node.js runtime (for example by deploying with a Dockerfile that installs both).
- On Render's free plan the service sleeps after a period of inactivity, so the first request after a pause can take about a minute.
- `frontend/dist` is tracked in git. The Render build regenerates it, but you can stop tracking it with `git rm -r --cached frontend/dist`.

---

## Database setup

Both environments need a real MySQL database before any DB-backed endpoint (login, ops onboarding) will work — see [docs/mysql_scrpt.sql](mysql_scrpt.sql) for the schema.

- **Local:** install MySQL locally (or use an existing instance), create a database, then run `mysql_scrpt.sql` against it. Point `DB_HOST=localhost` and the rest of the `DB_*` vars at it in `backend/env/local_dev.env`.
- **Render:** Render itself does not host MySQL (only Postgres). Provision MySQL elsewhere — PlanetScale, Railway, Aiven, and AWS RDS all work — run `mysql_scrpt.sql` against it once, then point the `DB_*` variables below at that host.

`mysql_scrpt.sql`'s final section seeds the reserved `PLATFORM` tenant plus one bootstrap `OPS_ADMIN` account (replace its placeholder `password_hash` with a real bcrypt hash before running — there is no other way to get the first ops login without one).

---

## Environment variables

| Backend (`backend/env/*.env`) | Frontend (`frontend/env/*.env`) | `local_dev` | `prod` |
|---|---|---|---|
| `ENV_NAME` | `VITE_ENV_NAME` | `local_dev` | `prod` |
| — | `VITE_API_URL` | `http://127.0.0.1:8000/api` | `https://med-zen.onrender.com/api` |
| — | `VITE_SAAS_URL` | `http://localhost:5173` | `https://med-zen.onrender.com` |
| `OPENAI_API_KEY` | — | your key | your key |
| `DEMO_USERNAME` / `DEMO_PASSWORD` | — | your choice | your choice |
| `JWT_SECRET` | — | your choice | a long random secret |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | — | your local MySQL (`DB_PORT` defaults to `3306`) | your production MySQL — check the provider's actual port |

Vite only exposes variables that start with `VITE_` to the browser. The backend does not use the API and site URLs, so they only exist on the frontend side.

## Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| `https://med-zen.onrender.com/` shows a JSON welcome message instead of the portal | `frontend/dist` was not built. Check the Render build logs for the `npm run build` step. |
| Frontend calls the wrong API URL | `VITE_API_URL` is baked in at build time. Rebuild (or restart `npm run dev`) after changing it. |
| Local login or API calls fail with a CORS error | The frontend's origin is not in `allow_origins` in [backend/main.py](../backend/main.py). |
| `Port 5173 is already in use` | Another Vite process is running. Stop it, or use a different `--port` and add that origin to CORS. |
| `GET /healthceck` returns 404 | The path moved to `/api/healthceck`. Update any health check that still uses the old one. |
| `OPENAI_API_KEY` errors from the chat agent | The key is missing in the env file (local) or the Render dashboard (prod). |
| Login returns 401 (demo login) | Wrong `DEMO_USERNAME` / `DEMO_PASSWORD` for that environment. |
| Login returns 401 (hospital/ops JWT login) | Wrong `identifier`/password, or the account/hospital is inactive — both endpoints return the same generic 401 regardless of which check failed (see [backend/README.md](../backend/README.md#auth-jwt--hospital--ops)). |
| `KeyError: 'DB_HOST'` (or `DB_USER`/`DB_PASSWORD`/`DB_NAME`) crashing a DB-backed request | One of the `DB_*` variables isn't set for that environment — see [Database setup](#database-setup). `db.py` builds the connection pool lazily on first DB use, so the app still boots and non-DB routes still work; only the first DB-touching request crashes. |
| `mysql.connector.errors.ProgrammingError: Unknown column '...' in 'field list'` | The database's schema is out of date relative to the code — re-run [docs/mysql_scrpt.sql](mysql_scrpt.sql) (or the relevant `ALTER TABLE` statements) against it. |
| `mysql.connector.errors.ConnectionTimeoutError: Can't connect to MySQL server on 'host:3306'` (request hangs, then times out) | `DB_PORT` is wrong or unset — you are trying port `3306` on a host that is not actually listening there. Managed MySQL providers (Aiven, PlanetScale, ...) assign a random per-service port; find the real one on their connection-info page and set `DB_PORT` to it. A wrong port times out instead of failing fast, because there is nothing on that port to reject the connection. |
