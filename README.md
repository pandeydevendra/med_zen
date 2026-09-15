# MediZen

MediZen is a hospital management platform with a FastAPI backend and a React (Vite) frontend.

## Structure

- [backend/](backend/) — FastAPI backend. See [backend/README.md](backend/README.md) for setup.
- [frontend/](frontend/) — React + Vite frontend.
- [docs/](docs/) — Project documentation.

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
npm install
npm run dev
```
