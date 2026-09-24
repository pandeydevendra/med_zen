"""
FastAPI dependencies for JWT auth, role checks, and tenant scoping. Wire them
into a route the same way as any other FastAPI dependency, e.g.:

    v1.add_api_route(
        "/tse-ops/hospitals/{hospital_uid}/...", handler, methods=["GET"],
        dependencies=[Depends(require_own_tenant)],
    )
"""

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from jwt_utils import decode_token

_bearer_scheme = HTTPBearer(auto_error=False)


def authenticate_jwt(credentials: HTTPAuthorizationCredentials = Depends(_bearer_scheme)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    try:
        return decode_token(credentials.credentials)
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def require_role(*roles: str):
    def _dependency(user: dict = Depends(authenticate_jwt)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Forbidden")
        return user

    return _dependency


def require_own_tenant(hospital_uid: str, user: dict = Depends(authenticate_jwt)) -> dict:
    is_super_ops = user["role"] == "OPS_ADMIN" and user.get("is_super") is True
    if not is_super_ops and user.get("hospital_uid") != hospital_uid:
        raise HTTPException(status_code=403, detail="Forbidden: tenant mismatch")
    return user
