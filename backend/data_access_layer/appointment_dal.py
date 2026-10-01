"""Raw SQL for the `appointments` table (see docs/mysql_scrpt.sql and
docs/migrations/003_booking_doctors_as_staff.sql). appointments.doctor_id is
the doctor's staff.id. Every query is scoped to one hospital_id."""

_ACTIVE_TOKENS_SQL = """
    SELECT a.slot_group_id, a.token_number
    FROM appointments a
    JOIN slot_groups g ON g.id = a.slot_group_id
    WHERE a.hospital_id = %s AND g.slot_date = %s AND a.status != 'CANCELLED'
"""

# Display fields for the booking desk. Older rows may have no patient_id, so
# the name falls back to the patient_name snapshot. token_offset is the number
# of slots in the doctor's earlier sessions that day, so tokens run on across
# a morning and an evening session instead of restarting at 1.
_LIST_SQL = """
    SELECT a.appointment_uid, a.token_number, a.status, a.created_at,
           g.slot_date, g.start_time, g.end_time, g.max_patients,
           (SELECT COALESCE(SUM(g2.max_patients), 0) FROM slot_groups g2
            WHERE g2.doctor_id = g.doctor_id AND g2.slot_date = g.slot_date
              AND g2.start_time < g.start_time) AS token_offset,
           COALESCE(p.full_name, a.patient_name) AS patient_name,
           p.patient_uid, p.phone AS patient_phone, p.age AS patient_age, p.gender AS patient_gender,
           doc.staff_uid AS doctor_uid, doc.full_name AS doctor_name, doc.department,
           doc.consultation_fee, cu.user_name AS booked_by
    FROM appointments a
    JOIN slot_groups g ON g.id = a.slot_group_id
    JOIN staff doc ON doc.id = a.doctor_id
    LEFT JOIN patients p ON p.id = a.patient_id
    LEFT JOIN users cu ON cu.id = a.created_by
    WHERE a.hospital_id = %s AND g.slot_date = %s {doctor_filter}
    ORDER BY g.start_time, a.token_number
"""

_PATIENT_HAS_ACTIVE_SQL = """
    SELECT 1
    FROM appointments a
    JOIN slot_groups g ON g.id = a.slot_group_id
    WHERE a.patient_id = %s AND a.doctor_id = %s AND g.slot_date = %s AND a.status != 'CANCELLED'
    LIMIT 1
"""

_INSERT_SQL = """
    INSERT INTO appointments (appointment_uid, hospital_id, doctor_id, slot_group_id, patient_id,
                              patient_name, token_number, status, created_by)
    VALUES (%s, %s, %s, %s, %s, %s, %s, 'BOOKED', %s)
"""

_LOCK_BY_UID_SQL = """
    SELECT a.id, a.status, a.slot_group_id, doc.user_id AS doctor_user_id
    FROM appointments a
    JOIN staff doc ON doc.id = a.doctor_id
    WHERE a.hospital_id = %s AND a.appointment_uid = %s
    FOR UPDATE
"""

_UPDATE_STATUS_SQL = "UPDATE appointments SET status = %s WHERE id = %s"


class AppointmentDAL:
    @staticmethod
    def active_tokens(cursor, hospital_id: int, slot_date) -> set[tuple[int, int]]:
        cursor.execute(_ACTIVE_TOKENS_SQL, (hospital_id, slot_date))
        return {(r["slot_group_id"], r["token_number"]) for r in cursor.fetchall()}

    @staticmethod
    def list_for_date(cursor, hospital_id: int, slot_date, doctor_user_id: int | None = None) -> list[dict]:
        if doctor_user_id is None:
            cursor.execute(_LIST_SQL.format(doctor_filter=""), (hospital_id, slot_date))
        else:
            cursor.execute(_LIST_SQL.format(doctor_filter="AND doc.user_id = %s"),
                           (hospital_id, slot_date, doctor_user_id))
        return cursor.fetchall()

    @staticmethod
    def patient_has_active(cursor, patient_id: int, doctor_id: int, slot_date) -> bool:
        cursor.execute(_PATIENT_HAS_ACTIVE_SQL, (patient_id, doctor_id, slot_date))
        return cursor.fetchone() is not None

    @staticmethod
    def insert(cursor, *, appointment_uid: str, hospital_id: int, doctor_id: int, slot_group_id: int,
               patient_id: int, patient_name: str, token_number: int, created_by: int) -> None:
        cursor.execute(_INSERT_SQL, (appointment_uid, hospital_id, doctor_id, slot_group_id, patient_id,
                                     patient_name, token_number, created_by))

    @staticmethod
    def lock_by_uid(cursor, hospital_id: int, appointment_uid: str) -> dict | None:
        cursor.execute(_LOCK_BY_UID_SQL, (hospital_id, appointment_uid))
        return cursor.fetchone()

    @staticmethod
    def update_status(cursor, appointment_id: int, status: str) -> None:
        cursor.execute(_UPDATE_STATUS_SQL, (status, appointment_id))
