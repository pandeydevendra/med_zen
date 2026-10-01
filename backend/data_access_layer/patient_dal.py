"""Raw SQL for the `patients` table (see docs/migrations/003_booking_doctors_as_staff.sql).
Every query is scoped to one hospital_id."""

_COLUMNS = "p.id, p.patient_uid, p.full_name, p.phone, p.age, p.gender"

_SEARCH_SQL = f"""
    SELECT {_COLUMNS}
    FROM patients p
    WHERE p.hospital_id = %s AND (p.full_name LIKE %s OR p.phone LIKE %s)
    ORDER BY p.full_name
    LIMIT 8
"""

_FIND_BY_UID_SQL = f"SELECT {_COLUMNS} FROM patients p WHERE p.hospital_id = %s AND p.patient_uid = %s"

_INSERT_SQL = """
    INSERT INTO patients (patient_uid, hospital_id, full_name, phone, age, gender, created_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
"""


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


class PatientDAL:
    @staticmethod
    def search(cursor, hospital_id: int, query: str) -> list[dict]:
        q = _escape_like(query)
        cursor.execute(_SEARCH_SQL, (hospital_id, f"%{q}%", f"{q}%"))
        return cursor.fetchall()

    @staticmethod
    def find_by_uid(cursor, hospital_id: int, patient_uid: str) -> dict | None:
        cursor.execute(_FIND_BY_UID_SQL, (hospital_id, patient_uid))
        return cursor.fetchone()

    @staticmethod
    def insert(cursor, *, patient_uid: str, hospital_id: int, full_name: str, phone: str,
               age: int | None, gender: str | None, created_by: int) -> None:
        cursor.execute(_INSERT_SQL, (patient_uid, hospital_id, full_name, phone, age, gender, created_by))
