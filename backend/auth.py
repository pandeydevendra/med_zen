"""
Demo login credentials. Override via env vars for a non-default demo login.
"""

import os

DEMO_USERNAME = os.environ.get("DEMO_USERNAME", "dev_med")
DEMO_PASSWORD = os.environ.get("DEMO_PASSWORD", "dev@med_patnagmc@123#")


def verify_credentials(username: str, password: str) -> bool:
    return username == DEMO_USERNAME and password == DEMO_PASSWORD
