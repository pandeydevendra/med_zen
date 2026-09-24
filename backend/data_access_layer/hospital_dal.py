"""Raw SQL for the `hospitals` table (see docs/mysql_scrpt.sql)."""

from db import get_connection

_INSERT_HOSPITAL_SQL = """
    INSERT INTO hospitals (hospital_uid, hospital_name, state_name, city, address, email, contact_number, org_type, onboarded_by, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
"""

_LIST_FACILITIES_SQL = """
    SELECT h.hospital_uid, h.hospital_name, h.address, h.email, h.contact_number, h.org_type,
           u.user_name AS admin_name, u.phone AS admin_phone, u.email AS admin_email
    FROM hospitals h
    LEFT JOIN users u ON u.id = (
        SELECT MIN(id) FROM users WHERE users.hospital_id = h.id AND users.access_role = 'ADMIN'
    )
    WHERE h.org_type != 'PLATFORM'
    ORDER BY h.id
"""


class HospitalDAL:
    @staticmethod
    def insert_hospital(
        cursor,
        *,
        hospital_uid: str,
        hospital_name: str,
        state_name: str | None,
        city: str | None,
        address: str | None,
        email: str | None,
        contact_number: str | None,
        org_type: str,
        onboarded_by: int | None,
    ) -> int:
        cursor.execute(
            _INSERT_HOSPITAL_SQL,
            (hospital_uid, hospital_name, state_name, city, address, email, contact_number, org_type, onboarded_by),
        )
        return cursor.lastrowid

    @staticmethod
    def list_facilities() -> list[dict]:
        """Real tenants (excludes the reserved PLATFORM row), each paired
        with its earliest ADMIN user."""
        conn = get_connection()
        try:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(_LIST_FACILITIES_SQL)
                return cur.fetchall()
        finally:
            conn.close()
