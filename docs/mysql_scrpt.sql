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

-- 5. DOCTORS
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dept_id INT NULL,                    -- NULL for INDIVIDUAL-type tenants
    hospital_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dept_id) REFERENCES departments(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 6. SLOT_GROUPS — a doctor's token window on a given date
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

    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 7. APPOINTMENTS
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    doctor_id INT NOT NULL,
    slot_group_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    token_number INT NOT NULL,
    status ENUM('BOOKED','COMPLETED','NO_SHOW','CANCELLED') DEFAULT 'BOOKED',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (slot_group_id) REFERENCES slot_groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 8. INDEXES
CREATE INDEX idx_users_hospital        ON users(hospital_id);
CREATE INDEX idx_doctors_dept          ON doctors(dept_id);
CREATE INDEX idx_slot_doctor_date      ON slot_groups(doctor_id, slot_date);
CREATE INDEX idx_appointments_doctor   ON appointments(doctor_id);
CREATE INDEX idx_appointments_slot     ON appointments(slot_group_id);
CREATE INDEX idx_hospitals_onboarded_by ON hospitals(onboarded_by);
CREATE INDEX idx_hospitals_type        ON hospitals(org_type);

ALTER TABLE appointments
  ADD CONSTRAINT unique_token_per_slot
  UNIQUE (slot_group_id, token_number);

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
