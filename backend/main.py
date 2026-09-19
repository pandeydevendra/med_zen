import sys
from typing import Optional

from dotenv import load_dotenv

# Ensure print() logs show up immediately (not buffered) even when stdout
# isn't an interactive terminal, e.g. when redirected to a log file.
sys.stdout.reconfigure(line_buffering=True)
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from auth import verify_credentials
from doctor_agent.service import filter_doctors, get_agent, get_filter_options, reset_session
from menu import get_menu_items

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "MedZen Doctor Booking Agent", "status_code": status.HTTP_200_OK}


@app.get("/healthceck")
def healthceck():
    return {"status": "ok", "status_code": status.HTTP_200_OK}


@app.get("/api/menu")
def menu(role: str = "receptionist"):
    print(f"[menu] role={role}")
    return {"items": get_menu_items(role)}


# ---------------------------------------------------------------------------
# Login — validates the demo credentials server-side.
# ---------------------------------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    role: str


@app.post("/api/auth/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    print(f"[login] attempt username={payload.username}")
    if not verify_credentials(payload.username, payload.password):
        print(f"[login] failed username={payload.username}")
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    print(f"[login] success username={payload.username}")
    return LoginResponse(success=True, role="receptionist")


# ---------------------------------------------------------------------------
# Doctor filter search (plain data, no LLM) — powers the left-side form UI.
# ---------------------------------------------------------------------------
@app.get("/api/doctors")
def list_doctors(
    specialty: Optional[str] = None,
    day: Optional[str] = None,
):
    print(f"[doctors] specialty={specialty} day={day}")
    return {"doctors": filter_doctors(specialty=specialty, day=day)}


@app.get("/api/doctors/filters")
def doctor_filters():
    print("[doctors/filters] requested")
    return get_filter_options()


# ---------------------------------------------------------------------------
# LLM chat agent — powers the right-side chat UI.
# ---------------------------------------------------------------------------
class AskRequest(BaseModel):
    session_id: str
    question: str


class AskResponse(BaseModel):
    answer: str


class SessionRequest(BaseModel):
    session_id: str


@app.post("/api/agent/ask", response_model=AskResponse)
def ask_agent(payload: AskRequest):
    print(f"[agent/ask] session={payload.session_id} question={payload.question!r}")
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question must not be empty.")
    try:
        agent = get_agent(payload.session_id)
        answer = agent.ask(payload.question)
    except ValueError as e:
        print(f"[agent/ask] error session={payload.session_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    print(f"[agent/ask] answer session={payload.session_id} answer={answer!r}")
    return AskResponse(answer=answer)


@app.post("/api/agent/reset")
def reset_agent(payload: SessionRequest):
    print(f"[agent/reset] session={payload.session_id}")
    reset_session(payload.session_id)
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
