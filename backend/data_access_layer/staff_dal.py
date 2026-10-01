"""Raw SQL for the `staff` table (see docs/mysql_scrpt.sql)."""

from db import get_connection

# Deliberately excludes id and hospital_id — this feeds an API response.
_LIST_BY_HOSPITAL_SQL = """
    SELECT s.staff_uid, s.full_name, s.gender, s.staff_role AS role, s.designation,
           s.phone, s.email, s.joined_on, s.is_active
    FROM staff s
    WHERE s.hospital_id = %s
    ORDER BY FIELD(s.staff_role, 'DOCTOR', 'NURSE', 'ADMIN_STAFF', 'RECEPTIONIST', 'TECHNICIAN', 'PHARMACIST',
                   'ASSISTANT', 'OTHER'),
             s.full_name
"""


class StaffDAL:
    @staticmethod
    def list_by_hospital(hospital_id: int) -> list[dict]:
        conn = get_connection()
        try:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(_LIST_BY_HOSPITAL_SQL, (hospital_id,))
                return cur.fetchall()
        finally:
            conn.close()
