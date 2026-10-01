"""Doctors are `staff` rows with staff_role = 'DOCTOR' (see
docs/migrations/003_booking_doctors_as_staff.sql). A doctor's public
identifier is staff.staff_uid; staff.id never leaves the backend.
staff.user_id links the doctor to their login, when they have one."""

_DOCTOR_COLUMNS = """
    s.id, s.hospital_id, s.staff_uid, s.full_name, s.department, s.consultation_fee, s.user_id
"""

_LIST_BY_HOSPITAL_SQL = f"""
    SELECT {_DOCTOR_COLUMNS}
    FROM staff s
    WHERE s.hospital_id = %s AND s.staff_role = 'DOCTOR' AND s.is_active = TRUE
    ORDER BY s.department, s.full_name
"""

_FIND_BY_STAFF_UID_SQL = f"""
    SELECT {_DOCTOR_COLUMNS}
    FROM staff s
    WHERE s.hospital_id = %s AND s.staff_uid = %s AND s.staff_role = 'DOCTOR' AND s.is_active = TRUE
"""


class DoctorDAL:
    @staticmethod
    def list_by_hospital(cursor, hospital_id: int) -> list[dict]:
        cursor.execute(_LIST_BY_HOSPITAL_SQL, (hospital_id,))
        return cursor.fetchall()

    @staticmethod
    def find_by_staff_uid(cursor, hospital_id: int, staff_uid: str) -> dict | None:
        cursor.execute(_FIND_BY_STAFF_UID_SQL, (hospital_id, staff_uid))
        return cursor.fetchone()
