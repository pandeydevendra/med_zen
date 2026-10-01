-- =====================================================================
-- MedZen — Final Schema (raw MySQL, no ORM)
-- Single `users` table for both hospital staff and platform ops staff.
-- Ops accounts live under a reserved `hospitals` row with org_type='PLATFORM'
-- (see hld-account-types.md for the reasoning behind this pattern).
-- =====================================================================

CREATE DATABASE IF NOT EXISTS med_zen;
USE med_zen;

-- 1. HOSPITALS — tenant table (real hospitals/clinics/solo doctors AND
--    the one reserved PLATFORM row that ops accounts hang off of)
CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_name VARCHAR(255) NOT NULL,
    state_name VARCHAR(100),
    city VARCHAR(100),
    org_type ENUM('HOSPITAL','CLINIC','INDIVIDUAL','PLATFORM') NOT NULL DEFAULT 'HOSPITAL',
    onboarded_by INT NULL,              -- FK added below, after `users` exists
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 1a. Stable external identifier for hospitals, safe to expose in URLs/APIs
--     without leaking the internal auto-increment id.
ALTER TABLE hospitals
  ADD COLUMN hospital_uid VARCHAR(36) NOT NULL UNIQUE AFTER id;

-- 1b. Freeform address, collected by the tse_ops onboarding UI (a single
--     text field) — distinct from the structured state_name/city pair above,
--     which the ops API (POST /api/v1/ops/hospitals) populates instead.
ALTER TABLE hospitals
  ADD COLUMN address VARCHAR(255) NULL AFTER city;

-- 1c. Facility-level contact details, collected by the tse_ops onboarding
--     UI alongside the address — distinct from the admin user's own login
--     phone (users.phone).
ALTER TABLE hospitals
  ADD COLUMN email VARCHAR(255) NULL AFTER address,
  ADD COLUMN contact_number VARCHAR(32) NULL AFTER email;

-- 2. USERS — the one login table for everyone (ADMIN/RECEPTIONIST/DOCTOR
--    for real tenants, OPS_ADMIN for staff under the PLATFORM tenant)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) UNIQUE NOT NULL,   -- login identifier; the tse_ops demo UI stores a
                                          -- free-text "admin username" here, not always a real phone number
    password_hash TEXT NOT NULL,
    access_role ENUM('ADMIN','RECEPTIONIST','DOCTOR','OPS_ADMIN') NOT NULL,
    is_super BOOLEAN DEFAULT FALSE,      -- meaningful only when access_role = OPS_ADMIN
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 2a. Stable external identifier for users, safe to expose in URLs/APIs
--     without leaking the internal auto-increment id.
ALTER TABLE users
  ADD COLUMN user_uid VARCHAR(36) NOT NULL UNIQUE AFTER id;

-- 2b. The user's own email — distinct from hospitals.email (the facility's
--     general contact address) and from phone (the login identifier).
ALTER TABLE users
  ADD COLUMN email VARCHAR(255) NULL AFTER phone;

-- 3. Close the circular reference: hospitals.onboarded_by -> users.id
ALTER TABLE hospitals
  ADD CONSTRAINT fk_hospitals_onboarded_by
  FOREIGN KEY (onboarded_by) REFERENCES users(id);

-- 4. DEPARTMENTS
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 5. STAFF — every person at a facility: doctors, nurses, office/admin staff,
--    technicians, ... A doctor is a staff row with staff_role = 'DOCTOR' plus
--    a department, a consultation fee and weekly hours (staff_schedules).
--    `users` holds logins only; user_id links a person to their login when
--    they have one (most staff never sign in).
CREATE TABLE staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_uid VARCHAR(36) NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    user_id INT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    gender ENUM('MALE','FEMALE','OTHER') NULL,
    staff_role ENUM('NURSE','ADMIN_STAFF','RECEPTIONIST','TECHNICIAN','PHARMACIST','OTHER','DOCTOR','ASSISTANT') NOT NULL,
    designation VARCHAR(100) NULL,       -- free text, e.g. "OT Nurse", "Clinic Administrator"
    department VARCHAR(100) NULL,        -- doctors: e.g. "ENT", "Obstetrics & Gynaecology"
    consultation_fee DECIMAL(10,2) NULL, -- doctors only, in rupees
    phone VARCHAR(32) NULL,
    email VARCHAR(255) NULL,
    joined_on DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 5b. STAFF_SCHEDULES — a doctor's weekly sessions. weekday: 0 = Monday ...
--     6 = Sunday. Each session is split into max_patients equal slots; the
--     booking API creates a slot_groups row per session per date on demand.
CREATE TABLE staff_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id INT NOT NULL,
    hospital_id INT NOT NULL,
    weekday TINYINT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_schedule_session (staff_id, weekday, start_time),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 5c. PATIENTS — per facility. Phone isn't unique: families often share one.
CREATE TABLE patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_uid VARCHAR(36) NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    age TINYINT UNSIGNED NULL,
    gender ENUM('MALE','FEMALE','OTHER') NULL,
    created_by INT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6. SLOT_GROUPS — one doctor session on one date (doctor_id = staff.id)
CREATE TABLE slot_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL,
    booked_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_slot_group (doctor_id, slot_date, start_time),
    FOREIGN KEY (doctor_id) REFERENCES staff(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 7. APPOINTMENTS — token_number is the slot's position within its session.
--    active_token makes the token unique only among non-cancelled bookings,
--    so cancelling frees the slot.
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_uid VARCHAR(36) NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    doctor_id INT NOT NULL,
    slot_group_id INT NOT NULL,
    patient_id INT NULL,
    patient_name VARCHAR(255) NOT NULL,  -- snapshot at booking time
    token_number INT NOT NULL,
    status ENUM('BOOKED','COMPLETED','NO_SHOW','CANCELLED') DEFAULT 'BOOKED',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active_token INT GENERATED ALWAYS AS (IF(status = 'CANCELLED', NULL, token_number)) STORED,

    UNIQUE KEY unique_active_token_per_slot (slot_group_id, active_token),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES staff(id),
    FOREIGN KEY (slot_group_id) REFERENCES slot_groups(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 8. INDEXES
CREATE INDEX idx_users_hospital        ON users(hospital_id);
CREATE INDEX idx_staff_hospital        ON staff(hospital_id);
CREATE INDEX idx_staff_schedules_hospital ON staff_schedules(hospital_id);
CREATE INDEX idx_patients_hospital_phone ON patients(hospital_id, phone);
CREATE INDEX idx_patients_hospital_name ON patients(hospital_id, full_name);
CREATE INDEX idx_slot_doctor_date      ON slot_groups(doctor_id, slot_date);
CREATE INDEX idx_appointments_doctor   ON appointments(doctor_id);
CREATE INDEX idx_appointments_slot     ON appointments(slot_group_id);
CREATE INDEX idx_hospitals_onboarded_by ON hospitals(onboarded_by);
CREATE INDEX idx_hospitals_type        ON hospitals(org_type);

-- 9. SEED — the reserved platform tenant + one bootstrap Super Ops account
--    (replace the password_hash with a real bcrypt hash before running)
--    Note: MySQL's UUID() produces a v1 UUID, used here only as a bootstrap
--    placeholder. Application code should generate real UUIDv7 values for
--    hospital_uid/user_uid on every row it creates after this seed.
INSERT INTO hospitals (hospital_uid, hospital_name, org_type, is_active)
VALUES (UUID(), 'MedZen Platform', 'PLATFORM', TRUE);

INSERT INTO users (user_uid, hospital_id, user_name, phone, password_hash, access_role, is_super)
SELECT UUID(), id, 'Super Admin', '9999999999', '<bcrypt-hash-here>', 'OPS_ADMIN', TRUE
FROM hospitals WHERE org_type = 'PLATFORM';
