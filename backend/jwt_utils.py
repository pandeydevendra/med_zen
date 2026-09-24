"""
JWT sign/verify helpers used by the hospital/ops login endpoints (user_auth.py)
and by the auth middleware (middleware.py). HS256, secret from JWT_SECRET,
8-hour expiry.
"""

import os
from datetime import datetime, timedelta, timezone

import jwt

JWT_ALGORITHM = "HS256"
JWT_EXPIRES_IN = timedelta(hours=8)


def sign_token(payload: dict) -> str:
    to_encode = {**payload, "exp": datetime.now(timezone.utc) + JWT_EXPIRES_IN}
    return jwt.encode(to_encode, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
