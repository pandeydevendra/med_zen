# MedZen Backend

This is the FastAPI backend for MedZen.

## Setup Instructions

1. **Create and activate a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```

The API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000). You can also view the interactive API documentation at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

## Environments

Config lives in [env/](env/) — one file per environment (`local_dev.env`, `prod.env`). Set `ENV_NAME` to choose which one is loaded; it defaults to `local_dev`. These files are git-ignored, so put your `OPENAI_API_KEY` in each.

| Variable | Purpose |
|---|---|
| `ENV_NAME` | Environment name (`local_dev` or `prod`) |
| `OPENAI_API_KEY` | OpenAI key for the doctor agent |
| `API_URL` | Base URL of the API |
| `SAAS_URL` | Base URL of the site |

Run locally (loads `env/local_dev.env`):

```bash
uvicorn main:app --reload
```

Run with the prod env:

```bash
# bash / Git Bash / macOS / Linux
ENV_NAME=prod uvicorn main:app --host 0.0.0.0 --port 8000
```

```powershell
# PowerShell
$env:ENV_NAME = "prod"; uvicorn main:app --host 0.0.0.0 --port 8000
```

On a host like Render, set `ENV_NAME=prod` as an environment variable and use `uvicorn main:app --host 0.0.0.0 --port $PORT` as the start command.

## API

The endpoint list is in [url.py](url.py) (URL → handler), the handlers are in [views.py](views.py), and everything is served under `/api`. Versioned endpoints live under `/api/v1` (e.g. `POST /api/v1/auth/login`, `GET /api/v1/doctors`); to introduce a breaking change, add a router with a `/v2` prefix and keep `/api/v1` running. The health check is unversioned at `GET /api/healthceck`, and `/` returns a welcome message.
