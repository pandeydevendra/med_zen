"""
In-memory hospital directory for tse_ops onboarding. Like doctor_agent's demo
data, this resets whenever the backend restarts — there's no database yet.
"""

_hospitals = []
_next_id = 1


def add_hospital(name: str, address: str, admin_username: str, admin_password: str) -> dict:
    global _next_id
    hospital = {
        "id": _next_id,
        "name": name,
        "address": address,
        "admin_username": admin_username,
        "admin_password": admin_password,
    }
    _hospitals.append(hospital)
    _next_id += 1
    return hospital


def list_hospitals() -> list:
    return list(_hospitals)
