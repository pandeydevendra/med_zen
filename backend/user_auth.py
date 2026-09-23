"""
JWT login for hospital staff and platform ops staff. Both roles live in the
single `users` table (see docs/mysql_scrpt.sql): hospital staff belong to a
real tenant row in `hospitals`, ops staff belong to the one reserved row
where `org_type = 'PLATFORM'`.

login_hospital_user() and login_ops_user() are two different guards over the
same table, not two different tables — an OPS_ADMIN account must never get a
token from the hospital endpoint and a hospital-staff account must never get
one from the ops endpoint. Both fail the same way regardless of *why* (wrong
phone, wrong password, wrong endpoint for that account's role, inactive
account): a generic 401, so a client can't tell which check failed.
"""

import bcrypt
from fastapi import HTTPException

from data_access_layer.user_dal import UserDAL
from jwt_utils import sign_token

_INVALID_CREDENTIALS = HTTPException(status_code=401, detail="Invalid credentials")


def _issue_token(row: dict) -> dict:
    payload = {
        "sub": str(row["id"]),  # PyJWT requires the "sub" claim to be a string (RFC 7519)
        "user_uid": row["user_uid"],
        "hospital_id": row["hospital_id"],
        "hospital_uid": row["hospital_uid"],
        "role": row["role"],
        "is_super": bool(row["is_super"]),
        "tenant_type": row["tenant_type"],
    }
    return {
        "token": sign_token(payload),
        "role": row["role"],
        "is_super": bool(row["is_super"]),
        "user_name": row["user_name"],
        "hospital_name": row["hospital_name"],
    }


def login_hospital_user(phone: str, password: str) -> dict:
    print(f"[auth/hospital/login] attempt phone={phone}")
    row = UserDAL.find_hospital_login(phone)
    if (
        row is None
        or row["role"] == "OPS_ADMIN"
        or not row["is_active"]
        or not row["hospital_active"]
        or not bcrypt.checkpw(password.encode(), row["password_hash"].encode())
    ):
        print(f"[auth/hospital/login] rejected phone={phone}")
        raise _INVALID_CREDENTIALS
    print(f"[auth/hospital/login] success phone={phone}")
    return _issue_token(row)


def login_ops_user(phone: str, password: str) -> dict:
    print(f"[auth/ops/login] attempt phone={phone}")
    row = UserDAL.find_ops_login(phone)
    if (
        row is None
        or row["role"] != "OPS_ADMIN"
        or not row["is_active"]
        or not bcrypt.checkpw(password.encode(), row["password_hash"].encode())
    ):
        print(f"[auth/ops/login] rejected phone={phone}")
        raise _INVALID_CREDENTIALS
    print(f"[auth/ops/login] success phone={phone}")
    return _issue_token(row)
