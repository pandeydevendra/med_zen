"""
Request handlers and request/response models. The URLs that map to these
handlers are listed in url.py.
"""

import os
from typing import Optional

from fastapi import HTTPException, Request, status
from pydantic import BaseModel

from auth import verify_credentials
from doctor_agent.service import filter_doctors, get_agent, get_filter_options, reset_session
from hospitals import add_hospital, list_hospitals
from menu import get_menu_items


def healthceck(request: Request):
    # Behind a proxy (Render) the scheme arrives in X-Forwarded-Proto, not in request.url.
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    base_url = f"{scheme}://{request.headers.get('host', request.url.netloc)}"
    # Built from the OpenAPI schema, so it stays in sync as endpoints are added.
    urls = sorted(
        f"{method.upper()} {base_url}{path}"
        for path, operations in request.app.openapi()["paths"].items()
        for method in operations
    )
    return {
        "status": "ok",
        "status_code": status.HTTP_200_OK,
        "env_name": os.environ.get("ENV_NAME", "local_dev"),
        "urls": urls,
    }


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
def list_doctors(
    specialty: Optional[str] = None,
    day: Optional[str] = None,
):
    print(f"[doctors] specialty={specialty} day={day}")
    return {"doctors": filter_doctors(specialty=specialty, day=day)}


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


def reset_agent(payload: SessionRequest):
    print(f"[agent/reset] session={payload.session_id}")
    reset_session(payload.session_id)
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# tse_ops — internal onboarding of new hospitals. Reuses the same demo login
# as the rest of the app (POST /api/v1/auth/login); there's no separate
# tse_ops credential. Hospitals live in memory only — see hospitals.py.
# ---------------------------------------------------------------------------
class OnboardHospitalRequest(BaseModel):
    hospital_name: str
    address: Optional[str] = None
    admin_username: str
    admin_password: str


class HospitalSummary(BaseModel):
    id: int
    hospital_name: str
    address: Optional[str] = None
    admin_username: str


def _to_summary(hospital: dict) -> HospitalSummary:
    return HospitalSummary(
        id=hospital["id"],
        hospital_name=hospital["name"],
        address=hospital["address"],
        admin_username=hospital["admin_username"],
    )


def onboard_hospital(payload: OnboardHospitalRequest):
    print(f"[tse_ops] onboarding hospital={payload.hospital_name!r} admin={payload.admin_username!r}")
    hospital = add_hospital(
        name=payload.hospital_name,
        address=payload.address,
        admin_username=payload.admin_username,
        admin_password=payload.admin_password,
    )
    return _to_summary(hospital)


def tse_ops_hospitals():
    return {"hospitals": [_to_summary(h) for h in list_hospitals()]}
