"""
Demo login credentials. Override via env vars for a non-default demo login.
"""

import os

DEMO_USERNAME = os.environ.get("DEMO_USERNAME", "dev_med")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "dev@med_patnagmc@123#")


def verify_credentials(username: str, password: str) -> bool:
    return username == DEMO_USERNAME and password == DEMO_PASSWORD


def login_failure_reason(username: str, password: str) -> str | None:
    """Diagnostic detail for [login] logs — deliberately never includes the
    password itself, only whether it was the username or the password that
    didn't match."""
    if username != DEMO_USERNAME:
        return "unknown_username"
    if password != DEMO_PASSWORD:
        return "wrong_password"
    return None
