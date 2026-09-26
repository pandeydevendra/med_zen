"""
Ops-side hospital directory: creating a new tenant (`hospitals` row) plus its
first ADMIN user in one transaction, and listing existing tenants. Backs both
the JWT-protected ops API (views.create_hospital, POST /api/v1/ops/hospitals)
and the legacy tse_ops demo UI (views.onboard_hospital/tse_ops_hospitals,
which has no per-request auth token — see TseOpsApp.jsx). See
docs/mysql_scrpt.sql for the schema; the raw SQL itself lives in
data_access_layer/.
"""

import mysql.connector
import bcrypt
from fastapi import HTTPException

from data_access_layer.hospital_dal import HospitalDAL
from data_access_layer.user_dal import UserDAL
from db import get_connection
from uid import uuid7

_ONBOARDABLE_TYPES = {"HOSPITAL", "CLINIC", "INDIVIDUAL"}  # PLATFORM is reserved


def create_hospital_with_admin(
    *,
    hospital_name: str,
    org_type: str,
    state_name: str | None = None,
    city: str | None = None,
    address: str | None = None,
    email: str | None = None,
    contact_number: str | None = None,
    admin_name: str,
    admin_phone: str,
    admin_email: str | None = None,
    admin_password: str,
    onboarded_by: int | None = None,
) -> dict:
    if org_type not in _ONBOARDABLE_TYPES:
        raise HTTPException(
            status_code=400, detail=f"org_type must be one of {sorted(_ONBOARDABLE_TYPES)}"
        )

    hospital_uid = uuid7()
    admin_uid = uuid7()
    password_hash = bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt(rounds=12)).decode()

    conn = get_connection()
    try:
        cur = conn.cursor()
        hospital_id = HospitalDAL.insert_hospital(
            cur,
            hospital_uid=hospital_uid,
            hospital_name=hospital_name,
            state_name=state_name,
            city=city,
            address=address,
            email=email,
            contact_number=contact_number,
            org_type=org_type,
            onboarded_by=onboarded_by,
        )
        UserDAL.insert_user(
            cur,
            user_uid=admin_uid,
            hospital_id=hospital_id,
            user_name=admin_name,
            phone=admin_phone,
            email=admin_email,
            password_hash=password_hash,
            access_role="ADMIN",
        )
        conn.commit()
        cur.close()
    except mysql.connector.errors.IntegrityError:
        conn.rollback()
        raise HTTPException(status_code=409, detail="Phone number already in use")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

    return {
        "hospital_uid": hospital_uid,
        "hospital_name": hospital_name,
        "address": address,
        "email": email,
        "contact_number": contact_number,
        "org_type": org_type,
        "admin_user_uid": admin_uid,
        "admin_name": admin_name,
        "admin_phone": admin_phone,
        "admin_email": admin_email,
    }


def list_facilities() -> list[dict]:
    """Real tenants (excludes the reserved PLATFORM row), each paired with
    its earliest ADMIN user, for the tse_ops directory listing."""
    return HospitalDAL.list_facilities()
