"""Raw SQL for `staff_schedules` (a doctor's weekly sessions) and
`slot_groups` (one session on one date). slot_groups.doctor_id is the
doctor's staff.id. See docs/migrations/003_booking_doctors_as_staff.sql."""

# Create the date's windows from the weekly schedule. INSERT IGNORE + the
# unique (doctor_id, slot_date, start_time) key make this safe to repeat and
# safe under concurrent requests.
_ENSURE_FROM_SCHEDULE_SQL = """
    INSERT IGNORE INTO slot_groups (doctor_id, hospital_id, slot_date, start_time, end_time, max_patients, booked_count)
    SELECT sch.staff_id, sch.hospital_id, %s, sch.start_time, sch.end_time, sch.max_patients, 0
    FROM staff_schedules sch
    JOIN staff s ON s.id = sch.staff_id AND s.staff_role = 'DOCTOR' AND s.is_active = TRUE
    WHERE sch.hospital_id = %s AND sch.weekday = %s AND sch.is_active = TRUE
"""

_LIST_FOR_DATE_SQL = """
    SELECT g.id, g.doctor_id, g.slot_date, g.start_time, g.end_time, g.max_patients
    FROM slot_groups g
    WHERE g.hospital_id = %s AND g.slot_date = %s
    ORDER BY g.doctor_id, g.start_time
"""

_LOCK_FOR_DOCTOR_DATE_SQL = """
    SELECT g.id, g.doctor_id, g.slot_date, g.start_time, g.end_time, g.max_patients
    FROM slot_groups g
    WHERE g.doctor_id = %s AND g.slot_date = %s
    ORDER BY g.start_time
    FOR UPDATE
"""

_LIST_WEEKLY_SCHEDULES_SQL = """
    SELECT sch.staff_id, sch.weekday, sch.start_time, sch.end_time
    FROM staff_schedules sch
    WHERE sch.hospital_id = %s AND sch.is_active = TRUE
    ORDER BY sch.staff_id, sch.weekday, sch.start_time
"""

_ADJUST_BOOKED_COUNT_SQL = """
    UPDATE slot_groups SET booked_count = GREATEST(booked_count + %s, 0) WHERE id = %s
"""


class SlotGroupDAL:
    @staticmethod
    def ensure_from_schedule(cursor, hospital_id: int, slot_date, weekday: int) -> None:
        cursor.execute(_ENSURE_FROM_SCHEDULE_SQL, (slot_date, hospital_id, weekday))

    @staticmethod
    def list_for_date(cursor, hospital_id: int, slot_date) -> list[dict]:
        cursor.execute(_LIST_FOR_DATE_SQL, (hospital_id, slot_date))
        return cursor.fetchall()

    @staticmethod
    def lock_for_doctor_date(cursor, doctor_id: int, slot_date) -> list[dict]:
        cursor.execute(_LOCK_FOR_DOCTOR_DATE_SQL, (doctor_id, slot_date))
        return cursor.fetchall()

    @staticmethod
    def list_weekly_schedules(cursor, hospital_id: int) -> list[dict]:
        cursor.execute(_LIST_WEEKLY_SCHEDULES_SQL, (hospital_id,))
        return cursor.fetchall()

    @staticmethod
    def adjust_booked_count(cursor, slot_group_id: int, delta: int) -> None:
        cursor.execute(_ADJUST_BOOKED_COUNT_SQL, (delta, slot_group_id))
