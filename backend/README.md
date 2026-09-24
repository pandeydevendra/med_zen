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
| `JWT_SECRET` | Signing secret for hospital/ops login JWTs (see Auth below) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |

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

## Auth (JWT — hospital + ops)

Real accounts (as opposed to the single demo login above) live in the `users` table — see [docs/mysql_scrpt.sql](../docs/mysql_scrpt.sql) for the schema. Hospital staff (`ADMIN`/`RECEPTIONIST`/`DOCTOR`) belong to a real tenant row in `hospitals`; platform ops staff (`OPS_ADMIN`) belong to the one reserved `hospitals` row where `org_type = 'PLATFORM'`, with `is_super` distinguishing Field Ops from Super Ops.

Two login endpoints, same table, different guard — a phone/password pair only produces a token from the endpoint that matches its account's role:

- `POST /api/v1/auth/hospital/login` — body `{ "phone", "password" }`. Rejects `OPS_ADMIN` accounts and inactive users/hospitals.
- `POST /api/v1/auth/ops/login` — body `{ "phone", "password" }`. Only accepts active `OPS_ADMIN` accounts under the `PLATFORM` tenant.

Both return `401 Invalid credentials` on any failure (wrong phone, wrong password, wrong endpoint for that role, inactive account) without saying which check failed. On success, both return `{ "token", "role", "is_super" }`; the JWT itself (see [jwt_utils.py](jwt_utils.py)) carries `sub`/`hospital_id` (internal numeric ids, for DB joins — `sub` is a string per RFC 7519, cast it back to `int` before using it in a query) and `user_uid`/`hospital_uid` (external UUIDs — always use these in URLs and response bodies, never the numeric ids), plus `role`, `is_super`, and `tenant_type`. Tokens expire after 8 hours.

Logic lives in [user_auth.py](user_auth.py) (the two login functions and their raw parameterized SQL), [jwt_utils.py](jwt_utils.py) (sign/verify), [db.py](db.py) (the `mysql-connector-python` pool — no ORM), and [middleware.py](middleware.py), which exposes three FastAPI dependencies for other routes to use:

- `authenticate_jwt` — verifies the bearer token, 401 if missing/invalid/expired.
- `require_role(*roles)` — 403 if the token's role isn't in the allowed list.
- `require_own_tenant` — for a route with a `{hospital_uid}` path param, 403 unless it matches the token's `hospital_uid`, except for `OPS_ADMIN` accounts with `is_super = true`, who can act across tenants.

### Ops hospital onboarding

`POST /api/v1/ops/hospitals` — behind `require_role("OPS_ADMIN")` (any `is_super` value). Body:

```json
{
  "hospital_name": "Patna General Hospital",
  "org_type": "HOSPITAL",
  "state_name": "Bihar",
  "city": "Patna",
  "admin_name": "Admin Name",
  "admin_phone": "9800000000",
  "admin_password": "..."
}
```

`org_type` must be `HOSPITAL`, `CLINIC`, or `INDIVIDUAL` (`PLATFORM` is reserved for the ops tenant — 400 otherwise). Logic in [ops_onboarding.py](ops_onboarding.py) inserts the `hospitals` row and its first `ADMIN` user in a single transaction (rolled back together on failure), stamping `onboarded_by` with the calling ops user's id and generating fresh UUIDv7 `hospital_uid`/`user_uid` values (see [uid.py](uid.py)). Returns 409 if `admin_phone` is already registered. Response never includes internal numeric ids:

```json
{
  "hospital_uid": "...",
  "hospital_name": "Patna General Hospital",
  "org_type": "HOSPITAL",
  "admin_user_uid": "...",
  "admin_name": "Admin Name",
  "admin_phone": "9800000000"
}
```

This is distinct from the in-memory demo onboarding at `POST /api/v1/tse-ops/hospitals` (see [hospitals.py](hospitals.py)), which still backs the current tse_ops UI and resets on every restart.
