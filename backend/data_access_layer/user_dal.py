"""Raw SQL for the `users` table (see docs/mysql_scrpt.sql)."""

from db import get_connection

# identifier matches either phone or email — callers pass the same value
# twice, once for each side of the OR.
_HOSPITAL_LOGIN_SQL = """
    SELECT u.id, u.user_uid, u.user_name, u.hospital_id, u.password_hash, u.access_role AS role, u.is_super, u.is_active,
           h.hospital_uid, h.hospital_name, h.org_type AS tenant_type, h.is_active AS hospital_active
    FROM users u
    JOIN hospitals h ON h.id = u.hospital_id
    WHERE (u.phone = %s OR u.email = %s)
      AND h.org_type != 'PLATFORM'
"""

_OPS_LOGIN_SQL = """
    SELECT u.id, u.user_uid, u.user_name, u.hospital_id, u.password_hash, u.access_role AS role, u.is_super, u.is_active,
           h.hospital_uid, h.hospital_name, h.org_type AS tenant_type
    FROM users u
    JOIN hospitals h ON h.id = u.hospital_id
    WHERE (u.phone = %s OR u.email = %s)
      AND h.org_type = 'PLATFORM'
"""

_INSERT_USER_SQL = """
    INSERT INTO users (user_uid, hospital_id, user_name, phone, email, password_hash, access_role, is_active)
    VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
"""


class UserDAL:
    @staticmethod
    def find_hospital_login(identifier: str) -> dict | None:
        conn = get_connection()
        try:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(_HOSPITAL_LOGIN_SQL, (identifier, identifier))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def find_ops_login(identifier: str) -> dict | None:
        conn = get_connection()
        try:
            with conn.cursor(dictionary=True) as cur:
                cur.execute(_OPS_LOGIN_SQL, (identifier, identifier))
                return cur.fetchone()
        finally:
            conn.close()

    @staticmethod
    def insert_user(
        cursor,
        *,
        user_uid: str,
        hospital_id: int,
        user_name: str,
        phone: str,
        email: str | None = None,
        password_hash: str,
        access_role: str,
    ) -> None:
        cursor.execute(
            _INSERT_USER_SQL,
            (user_uid, hospital_id, user_name, phone, email, password_hash, access_role),
        )
