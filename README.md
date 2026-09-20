# MediZen

MediZen is a hospital management platform with a FastAPI backend and a React (Vite) frontend.

## Structure

- [backend/](backend/) — FastAPI backend. See [backend/README.md](backend/README.md) for setup.
- [frontend/](frontend/) — React + Vite frontend.
- [docs/](docs/) — Project documentation, including the [deployment guide](docs/DEPLOYMENT.md) (local and Render).

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

API available at [http://127.0.0.1:8000](http://127.0.0.1:8000), interactive docs at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Frontend

```bash
cd frontend
npm install        # first time only
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The frontend calls the backend at `http://127.0.0.1:8000/api/v1/...`, so run the backend in a separate terminal at the same time.

### Editor setup (VS Code)

Install the **Python** extension (`ms-python.python`, includes Pylance) for Python code navigation, and select the project's interpreter (bottom-right of the window). Import paths for `backend/` are already set in [.vscode/settings.json](.vscode/settings.json).

## Running with an environment

Each app has an `env/` folder with `local_dev.env` and `prod.env` (git-ignored — add your own keys).

| | Local dev | Prod |
|---|---|---|
| **FastAPI** ([details](backend/README.md#environments)) | `uvicorn main:app --reload` | `ENV_NAME=prod uvicorn main:app --host 0.0.0.0 --port 8000` (PowerShell: `$env:ENV_NAME="prod"; uvicorn ...`) |
| **React** ([details](frontend/README.md#environments)) | `npm run dev` | `npm run dev:prod` to run, `npm run build` to build |

API endpoints are listed in [backend/url.py](backend/url.py) under `/api/v1`; handlers are in [backend/views.py](backend/views.py).
