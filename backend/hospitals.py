"""
In-memory facility directory for tse_ops onboarding. Like doctor_agent's demo
data, this resets whenever the backend restarts — there's no database yet.

A "facility" is a hospital, a clinic, or an individual doctor practice — all
onboarded the same way (a name plus one admin login).
"""

FACILITY_TYPES = ["Hospital", "Clinic", "Individual Doctor"]

_hospitals = []
_next_id = 1


def add_hospital(
    name: str,
    address: str,
    admin_username: str,
    admin_password: str,
    facility_type: str = "Hospital",
) -> dict:
    global _next_id
    hospital = {
        "id": _next_id,
        "name": name,
        "address": address,
        "admin_username": admin_username,
        "admin_password": admin_password,
        "facility_type": facility_type if facility_type in FACILITY_TYPES else "Hospital",
    }
    _hospitals.append(hospital)
    _next_id += 1
    return hospital


def list_hospitals() -> list:
    return list(_hospitals)


# ---------------------------------------------------------------------------
# Sample data, so the tse_ops UI has something to show right after a deploy
# instead of an empty list. Demo only — same shape as a real onboarded entry.
# ---------------------------------------------------------------------------
_SAMPLE_FACILITIES = [
    ("Hospital", "Patna General Hospital", "Boring Road, Patna", "patna_general_admin"),
    ("Hospital", "Kaimur District Hospital", "Bhabua, Kaimur", "kaimur_district_admin"),
    ("Clinic", "Sunrise Family Clinic", "Kankarbagh, Patna", "sunrise_clinic_admin"),
    ("Clinic", "Wellness Care Clinic", "Danapur, Patna", "wellness_clinic_admin"),
    ("Clinic", "Apex Diagnostics Clinic", "Fraser Road, Patna", "apex_clinic_admin"),
    ("Individual Doctor", "Dr. A. Sharma — General Physician", "Ashok Rajpath, Patna", "dr_asharma"),
    ("Individual Doctor", "Dr. N. Verma — Pediatrician", "Rajendra Nagar, Patna", "dr_nverma"),
    ("Individual Doctor", "Dr. S. Gupta — Dermatologist", "Boring Road, Patna", "dr_sgupta"),
    ("Individual Doctor", "Dr. P. Singh — Orthopedic", "Kankarbagh, Patna", "dr_psingh"),
]


def _seed():
    for facility_type, name, address, admin_username in _SAMPLE_FACILITIES:
        add_hospital(
            name=name,
            address=address,
            admin_username=admin_username,
            admin_password="Demo@1234",
            facility_type=facility_type,
        )


_seed()
