"""
Front-desk booking: a facility's bookable doctors and their slots for a date,
patient search/registration, booking an appointment with a token number, and
moving appointments through BOOKED -> COMPLETED / NO_SHOW / CANCELLED.

Everything is scoped to the caller's own facility (the hospital_id in their
JWT). Doctors are `staff` rows with staff_role DOCTOR; their weekly sessions
live in `staff_schedules`, and for each date the matching sessions are
materialised into `slot_groups` on demand. A session is split into
`max_patients` equal slots. appointments.token_number is the slot's position
within its session; the token shown to people runs on across the doctor's
sessions that day (morning 1-16, evening 17-28). The raw SQL lives in
data_access_layer/; see docs/migrations/003_booking_doctors_as_staff.sql.
"""

import re
from datetime import date, datetime, time, timedelta, timezone

import mysql.connector
from fastapi import HTTPException

from data_access_layer.appointment_dal import AppointmentDAL
from data_access_layer.doctor_dal import DoctorDAL
from data_access_layer.patient_dal import PatientDAL
from data_access_layer.slot_group_dal import SlotGroupDAL
from db import get_connection
from uid import uuid7

# Facilities are in India (no DST), so "now" and "today" are IST, regardless
# of the server's own timezone.
IST = timezone(timedelta(hours=5, minutes=30))
BOOKING_WINDOW_DAYS = 60
STATUSES = {"BOOKED", "COMPLETED", "NO_SHOW", "CANCELLED"}
DOCTOR_SETTABLE_STATUSES = {"BOOKED", "COMPLETED", "NO_SHOW"}
WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _now_ist() -> datetime:
    return datetime.now(IST).replace(tzinfo=None)


def _hhmm(value: timedelta) -> str:
    minutes = int(value.total_seconds()) // 60
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def _slot_step(group: dict) -> timedelta:
    return (group["end_time"] - group["start_time"]) / group["max_patients"]


def _slot_start(group: dict, token: int) -> timedelta:
    return group["start_time"] + _slot_step(group) * (token - 1)


def _is_bookable_date(slot_date: date) -> bool:
    today = _now_ist().date()
    return today <= slot_date <= today + timedelta(days=BOOKING_WINDOW_DAYS)


def _fee(value) -> float | None:
    return float(value) if value is not None else None


def _day_list(days: list[int]) -> str:
    """[0, 2, 4] -> 'Mon, Wed, Fri'; runs of 3+ consecutive days collapse:
    [0, 1, 2, 3, 4, 5] -> 'Mon-Sat'."""
    runs: list[list[int]] = []
    for d in sorted(days):
        if runs and d == runs[-1][-1] + 1:
            runs[-1].append(d)
        else:
            runs.append([d])
    parts = []
    for run in runs:
        if len(run) >= 3:
            parts.append(f"{WEEKDAYS[run[0]]}-{WEEKDAYS[run[-1]]}")
        else:
            parts.extend(WEEKDAYS[d] for d in run)
    return ", ".join(parts)


def _weekly_summary(rows: list[dict]) -> list[str]:
    """Sessions grouped so days with identical hours merge:
    ['Mon, Wed, Fri 10:00-14:00', 'Tue, Thu, Sat 16:00-19:00']."""
    by_hours: dict[str, list[int]] = {}
    for r in rows:
        by_hours.setdefault(f"{_hhmm(r['start_time'])}-{_hhmm(r['end_time'])}", []).append(r["weekday"])
    ordered = sorted(by_hours.items(), key=lambda item: min(item[1]))
    return [f"{_day_list(days)} {hours}" for hours, days in ordered]


def _run(fn, *, write: bool = False):
    """Run fn(cursor) on one pooled connection; commit if write, else roll back."""
    conn = get_connection()
    try:
        with conn.cursor(dictionary=True) as cur:
            result = fn(cur)
        if write:
            conn.commit()
        else:
            conn.rollback()
        return result
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ---------------------------------------------------------------------------
# Doctors and slots
# ---------------------------------------------------------------------------
def list_doctors_with_slots(hospital_id: int, slot_date: date) -> dict:
    now = _now_ist()

    def _query(cur):
        if _is_bookable_date(slot_date):
            SlotGroupDAL.ensure_from_schedule(cur, hospital_id, slot_date, slot_date.weekday())
        doctors = DoctorDAL.list_by_hospital(cur, hospital_id)
        groups = SlotGroupDAL.list_for_date(cur, hospital_id, slot_date)
        taken = AppointmentDAL.active_tokens(cur, hospital_id, slot_date)
        schedules = SlotGroupDAL.list_weekly_schedules(cur, hospital_id)
        return doctors, groups, taken, schedules

    doctors, groups, taken, schedules = _run(_query, write=True)

    result = []
    for doc in doctors:
        windows, slots, offset = [], [], 0
        for g in (g for g in groups if g["doctor_id"] == doc["id"]):  # ordered by start_time
            windows.append({"start": _hhmm(g["start_time"]), "end": _hhmm(g["end_time"])})
            for position in range(1, g["max_patients"] + 1):
                start = _slot_start(g, position)
                is_past = datetime.combine(slot_date, time()) + start <= now
                is_taken = (g["id"], position) in taken
                slots.append({
                    "time": _hhmm(start),
                    "token": offset + position,
                    "available": not is_taken and not is_past,
                    "status": "booked" if is_taken else ("past" if is_past else "open"),
                })
            offset += g["max_patients"]
        result.append({
            "doctor_uid": doc["staff_uid"],
            "name": doc["full_name"],
            "department": doc["department"],
            "consultation_fee": _fee(doc["consultation_fee"]),
            "weekly_hours": _weekly_summary([s for s in schedules if s["staff_id"] == doc["id"]]),
            "windows": windows,
            "slots": slots,
        })
    return {"date": slot_date, "bookable_date": _is_bookable_date(slot_date), "doctors": result}


# ---------------------------------------------------------------------------
# Patients
# ---------------------------------------------------------------------------
def _public_patient(row: dict) -> dict:
    return {k: row[k] for k in ("patient_uid", "full_name", "phone", "age", "gender")}


def search_patients(hospital_id: int, query: str) -> list[dict]:
    query = query.strip()
    if len(query) < 2:
        return []
    rows = _run(lambda cur: PatientDAL.search(cur, hospital_id, query))
    return [_public_patient(r) for r in rows]


def _normalise_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) != 10:
        raise HTTPException(status_code=400, detail="Enter a 10-digit mobile number.")
    return digits


def create_patient(hospital_id: int, created_by: int, *, full_name: str, phone: str,
                   age: int | None, gender: str | None) -> dict:
    full_name = " ".join(full_name.split())
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Enter the patient's full name.")
    if age is not None and not 0 <= age <= 120:
        raise HTTPException(status_code=400, detail="Age must be between 0 and 120.")
    gender = gender.upper() if gender else None
    if gender is not None and gender not in {"MALE", "FEMALE", "OTHER"}:
        raise HTTPException(status_code=400, detail="Gender must be Male, Female or Other.")
    patient = {"patient_uid": uuid7(), "full_name": full_name, "phone": _normalise_phone(phone),
               "age": age, "gender": gender}
    _run(lambda cur: PatientDAL.insert(cur, hospital_id=hospital_id, created_by=created_by, **patient), write=True)
    return patient


# ---------------------------------------------------------------------------
# Appointments
# ---------------------------------------------------------------------------
def _public_appointment(row: dict) -> dict:
    return {
        "appointment_uid": row["appointment_uid"],
        "token": int(row["token_offset"]) + row["token_number"],
        "status": row["status"],
        "date": row["slot_date"],
        "time": _hhmm(_slot_start(row, row["token_number"])),
        "patient": {
            "patient_uid": row["patient_uid"],
            "full_name": row["patient_name"],
            "phone": row["patient_phone"],
            "age": row["patient_age"],
            "gender": row["patient_gender"],
        },
        "doctor": {"doctor_uid": row["doctor_uid"], "name": row["doctor_name"], "department": row["department"]},
        "consultation_fee": _fee(row["consultation_fee"]),
        "booked_by": row["booked_by"],
        "booked_at": row["created_at"],
    }


def list_appointments(hospital_id: int, slot_date: date, *, doctor_user_id: int | None = None) -> list[dict]:
    rows = _run(lambda cur: AppointmentDAL.list_for_date(cur, hospital_id, slot_date, doctor_user_id))
    return [_public_appointment(r) for r in rows]


def _parse_hhmm(value: str) -> timedelta:
    match = re.fullmatch(r"(\d{1,2}):(\d{2})", value.strip())
    if not match or int(match[1]) > 23 or int(match[2]) > 59:
        raise HTTPException(status_code=400, detail="Time must be HH:MM.")
    return timedelta(hours=int(match[1]), minutes=int(match[2]))


def book_appointment(hospital_id: int, created_by: int, *, doctor_uid: str, slot_date: date,
                     slot_time: str, patient_uid: str) -> dict:
    if not _is_bookable_date(slot_date):
        raise HTTPException(status_code=400, detail=f"Bookings are open from today up to {BOOKING_WINDOW_DAYS} days ahead.")
    start = _parse_hhmm(slot_time)
    if datetime.combine(slot_date, time()) + start <= _now_ist():
        raise HTTPException(status_code=400, detail="That time has already passed.")
    appointment_uid = uuid7()

    def _book(cur):
        doctor = DoctorDAL.find_by_staff_uid(cur, hospital_id, doctor_uid)
        if doctor is None:
            raise HTTPException(status_code=404, detail="Doctor not found.")
        patient = PatientDAL.find_by_uid(cur, hospital_id, patient_uid)
        if patient is None:
            raise HTTPException(status_code=404, detail="Patient not found.")

        SlotGroupDAL.ensure_from_schedule(cur, hospital_id, slot_date, slot_date.weekday())
        # Locks the doctor's windows for this date until commit, so two desks
        # can't hand out the same token at once.
        groups = SlotGroupDAL.lock_for_doctor_date(cur, doctor["id"], slot_date)
        group, position = None, None
        for g in groups:
            into, step = start - g["start_time"], _slot_step(g)
            if timedelta(0) <= into < g["end_time"] - g["start_time"] and into % step == timedelta(0):
                group, position = g, int(into / step) + 1
                break
        if group is None:
            raise HTTPException(status_code=400, detail=f"{doctor['full_name']} has no slot at {slot_time} on this day.")
        if AppointmentDAL.patient_has_active(cur, patient["id"], doctor["id"], slot_date):
            raise HTTPException(status_code=409, detail=f"{patient['full_name']} already has an appointment with {doctor['full_name']} on this day.")

        AppointmentDAL.insert(cur, appointment_uid=appointment_uid, hospital_id=hospital_id, doctor_id=doctor["id"],
                              slot_group_id=group["id"], patient_id=patient["id"],
                              patient_name=patient["full_name"], token_number=position, created_by=created_by)
        SlotGroupDAL.adjust_booked_count(cur, group["id"], +1)
        return AppointmentDAL.list_for_date(cur, hospital_id, slot_date)

    try:
        rows = _run(_book, write=True)
    except mysql.connector.errors.IntegrityError:
        raise HTTPException(status_code=409, detail="That slot was just booked. Pick another time.")
    return _public_appointment(next(r for r in rows if r["appointment_uid"] == appointment_uid))


def update_appointment_status(hospital_id: int, user: dict, appointment_uid: str, status: str) -> None:
    status = status.upper()
    if status not in STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {sorted(STATUSES)}.")
    is_doctor = user["role"] == "DOCTOR"
    if is_doctor and status not in DOCTOR_SETTABLE_STATUSES:
        raise HTTPException(status_code=403, detail="Doctors can't cancel appointments.")

    def _update(cur):
        appt = AppointmentDAL.lock_by_uid(cur, hospital_id, appointment_uid)
        if appt is None:
            raise HTTPException(status_code=404, detail="Appointment not found.")
        if is_doctor and appt["doctor_user_id"] != int(user["sub"]):
            raise HTTPException(status_code=403, detail="This isn't your appointment.")
        if appt["status"] == status:
            return
        AppointmentDAL.update_status(cur, appt["id"], status)
        if status == "CANCELLED":
            SlotGroupDAL.adjust_booked_count(cur, appt["slot_group_id"], -1)
        elif appt["status"] == "CANCELLED":
            SlotGroupDAL.adjust_booked_count(cur, appt["slot_group_id"], +1)

    try:
        _run(_update, write=True)
    except mysql.connector.errors.IntegrityError:
        raise HTTPException(status_code=409, detail="That slot has been booked by someone else since this was cancelled.")
