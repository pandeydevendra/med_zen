"""
Request handlers and request/response models. The URLs that map to these
handlers are listed in url.py.
"""

import os
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from pydantic import BaseModel

from auth import login_failure_reason, verify_credentials
from doctor_agent.service import filter_doctors, get_agent, get_filter_options, reset_session
from menu import get_menu_items
from middleware import require_role
from ops_onboarding import create_hospital_with_admin, list_facilities
from user_auth import login_hospital_user, login_ops_user


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
        reason = login_failure_reason(payload.username, payload.password)
        print(f"[login] failed username={payload.username} reason={reason}")
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    print(f"[login] success username={payload.username} role=receptionist")
    return LoginResponse(success=True, role="receptionist")


# ---------------------------------------------------------------------------
# JWT login — hospital staff (ADMIN/RECEPTIONIST/DOCTOR) and platform ops
# staff (OPS_ADMIN) share the `users` table but log in through different
# endpoints; see user_auth.py for the guards that keep the two separate.
# `identifier` accepts either the account's phone or its email.
# ---------------------------------------------------------------------------
class IdentifierLoginRequest(BaseModel):
    identifier: str
    password: str


class TokenResponse(BaseModel):
    token: str
    role: str
    is_super: bool
    user_name: str
    hospital_name: str


def hospital_login(payload: IdentifierLoginRequest):
    return TokenResponse(**login_hospital_user(payload.identifier, payload.password))


def ops_login(payload: IdentifierLoginRequest):
    return TokenResponse(**login_ops_user(payload.identifier, payload.password))


# ---------------------------------------------------------------------------
# Ops hospital onboarding — an authenticated OPS_ADMIN (any is_super value)
# creates a new tenant plus its first ADMIN user in one transaction. DB-backed
# (see ops_onboarding.py); distinct from the in-memory tse_ops demo below.
# ---------------------------------------------------------------------------
class CreateHospitalRequest(BaseModel):
    hospital_name: str
    org_type: str
    state_name: Optional[str] = None
    city: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    admin_name: str
    admin_phone: str
    admin_email: Optional[str] = None
    admin_password: str


class CreateHospitalResponse(BaseModel):
    hospital_uid: str
    hospital_name: str
    email: Optional[str] = None
    contact_number: Optional[str] = None
    org_type: str
    admin_user_uid: str
    admin_name: str
    admin_phone: str
    admin_email: Optional[str] = None


def create_hospital(payload: CreateHospitalRequest, ops_user: dict = Depends(require_role("OPS_ADMIN"))):
    print(f"[ops/hospitals] {payload.org_type}={payload.hospital_name!r} onboarded_by sub={ops_user['sub']}")
    result = create_hospital_with_admin(
        hospital_name=payload.hospital_name,
        org_type=payload.org_type,
        state_name=payload.state_name,
        city=payload.city,
        email=payload.email,
        contact_number=payload.contact_number,
        admin_name=payload.admin_name,
        admin_phone=payload.admin_phone,
        admin_email=payload.admin_email,
        admin_password=payload.admin_password,
        onboarded_by=int(ops_user["sub"]),
    )
    return CreateHospitalResponse(**result)


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
# tse_ops credential, so this endpoint carries no bearer token — unlike
# POST /api/v1/ops/hospitals above, it's gated only by the tse_ops UI's own
# login screen, not by the API itself. DB-backed via ops_onboarding.py.
# ---------------------------------------------------------------------------
FACILITY_TYPES = ["Hospital", "Clinic", "Individual Doctor"]
_DISPLAY_TO_ORG_TYPE = {"Hospital": "HOSPITAL", "Clinic": "CLINIC", "Individual Doctor": "INDIVIDUAL"}
_ORG_TYPE_TO_DISPLAY = {v: k for k, v in _DISPLAY_TO_ORG_TYPE.items()}


class OnboardHospitalRequest(BaseModel):
    hospital_name: str
    address: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    admin_username: str
    admin_email: Optional[str] = None
    admin_password: str
    facility_type: str = "Hospital"


class HospitalSummary(BaseModel):
    id: str
    hospital_name: str
    address: Optional[str] = None
    email: Optional[str] = None
    contact_number: Optional[str] = None
    admin_username: str
    admin_email: Optional[str] = None
    facility_type: str


def onboard_hospital(payload: OnboardHospitalRequest):
    print(f"[tse_ops] onboarding {payload.facility_type}={payload.hospital_name!r} admin={payload.admin_username!r}")
    result = create_hospital_with_admin(
        org_type=_DISPLAY_TO_ORG_TYPE.get(payload.facility_type, "HOSPITAL"),
        hospital_name=payload.hospital_name,
        address=payload.address,
        email=payload.email,
        contact_number=payload.contact_number,
        admin_name=payload.admin_username,
        admin_phone=payload.admin_username,
        admin_email=payload.admin_email,
        admin_password=payload.admin_password,
    )
    return HospitalSummary(
        id=result["hospital_uid"],
        hospital_name=result["hospital_name"],
        address=result["address"],
        email=result["email"],
        contact_number=result["contact_number"],
        admin_username=result["admin_phone"],
        admin_email=result["admin_email"],
        facility_type=payload.facility_type,
    )


def tse_ops_hospitals():
    return {
        "hospitals": [
            HospitalSummary(
                id=f["hospital_uid"],
                hospital_name=f["hospital_name"],
                address=f["address"],
                email=f["email"],
                contact_number=f["contact_number"],
                admin_username=f["admin_phone"] or "",
                admin_email=f["admin_email"],
                facility_type=_ORG_TYPE_TO_DISPLAY.get(f["org_type"], f["org_type"]),
            )
            for f in list_facilities()
        ],
        "facility_types": FACILITY_TYPES,
    }
