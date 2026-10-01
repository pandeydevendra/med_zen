-- Migration 003: database-backed appointment booking, with doctors as staff.
--
-- Every person at a facility - doctors included - is one `staff` row. A
-- doctor is a staff row with staff_role = 'DOCTOR' plus a department, a
-- consultation fee and weekly hours in `staff_schedules`. `users` stays the
-- login table only; staff.user_id links a person to their login when they
-- have one.
--
-- Written for production's actual state: tables hospitals, users, staff and
-- (from an earlier partial run) patients; NO departments / doctors /
-- slot_groups / appointments tables. The booking tables are created here in
-- their final shape - the same definitions as docs/mysql_scrpt.sql.
--
-- How to run (MySQL Workbench, MediZen database selected as default schema):
--   1. Run step 0 on its own (Ctrl+Enter) and compare with the expected values.
--   2. If they match, run the whole file with Execute All (Ctrl+Shift+Enter).
--      Workbench stops at the first error, so nothing runs past a problem.
-- Steps 1-5 change the schema; steps 6-11 (the seed) are safe to repeat.

-- 0. Pre-flight check - changes nothing. Expect:
--      database = med_zen, already_migrated = 0, staff_schedules = 0,
--      slot_groups = 0, appointments = 0, patients = 1, mysql_version 8.x
SELECT DATABASE() AS `database`,
       (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'user_id') AS already_migrated,
       (SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'staff_schedules') AS staff_schedules,
       (SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'slot_groups') AS slot_groups,
       (SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'appointments') AS appointments,
       (SELECT COUNT(*) FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'patients') AS patients,
       VERSION() AS mysql_version;

-- Workbench's default "safe updates" mode can block the multi-table UPDATEs
-- in the seed. Turn it off for this session; the last statement restores it.
SET @saved_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- 1. Doctor details and the login link on staff.
ALTER TABLE staff
  ADD COLUMN user_id INT NULL UNIQUE AFTER hospital_id,
  ADD COLUMN department VARCHAR(100) NULL AFTER designation,
  ADD COLUMN consultation_fee DECIMAL(10,2) NULL AFTER department,
  ADD CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id);

-- 2. Weekly consultation hours. weekday: 0 = Monday ... 6 = Sunday. Each row
--    is one session, split into max_patients equal slots; the booking API
--    turns it into a `slot_groups` row for each date on demand.
CREATE TABLE IF NOT EXISTS staff_schedules (
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
    INDEX idx_staff_schedules_hospital (hospital_id),
    FOREIGN KEY (staff_id) REFERENCES staff(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 3. Patients, per facility (already exists in production - this is then a
--    no-op). Phone isn't unique: families often share one number.
CREATE TABLE IF NOT EXISTS patients (
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

    INDEX idx_patients_hospital_phone (hospital_id, phone),
    INDEX idx_patients_hospital_name (hospital_id, full_name),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 4. One doctor session on one date (doctor_id = the doctor's staff.id).
CREATE TABLE IF NOT EXISTS slot_groups (
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
    INDEX idx_slot_doctor_date (doctor_id, slot_date),
    FOREIGN KEY (doctor_id) REFERENCES staff(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 5. Appointments. token_number is the slot's position within its session;
--    active_token makes it unique only among non-cancelled bookings, so a
--    cancellation frees the slot. patient_name is a snapshot at booking time.
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    appointment_uid VARCHAR(36) NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    doctor_id INT NOT NULL,
    slot_group_id INT NOT NULL,
    patient_id INT NULL,
    patient_name VARCHAR(255) NOT NULL,
    token_number INT NOT NULL,
    status ENUM('BOOKED','COMPLETED','NO_SHOW','CANCELLED') DEFAULT 'BOOKED',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    active_token INT GENERATED ALWAYS AS (IF(status = 'CANCELLED', NULL, token_number)) STORED,

    UNIQUE KEY unique_active_token_per_slot (slot_group_id, active_token),
    INDEX idx_appointments_doctor (doctor_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES staff(id),
    FOREIGN KEY (slot_group_id) REFERENCES slot_groups(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Seed: make every doctor bookable.
--   ABC     01a0ddf6-562b-7bc3-b763-338c9a51e3d9
--   Dr AKT  01a0de16-83b1-78bc-b8a1-da3e64610830
-- ---------------------------------------------------------------------------

-- 6. Department and consultation fee for ABC's two doctors.
UPDATE staff s
JOIN hospitals h ON h.id = s.hospital_id
SET s.department = 'Obstetrics & Gynaecology', s.consultation_fee = 800.00
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
  AND s.full_name = 'Dr. Kavita Sinha' AND s.staff_role = 'DOCTOR';

UPDATE staff s
JOIN hospitals h ON h.id = s.hospital_id
SET s.department = 'ENT', s.consultation_fee = 700.00
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
  AND s.full_name = 'Dr. Rajeev Ranjan Mishra' AND s.staff_role = 'DOCTOR';

-- 7. Dr AKT himself, as the doctor on his own clinic's staff, linked to the
--    clinic's existing admin login.
INSERT INTO staff (staff_uid, hospital_id, user_id, full_name, gender, staff_role, designation,
                   department, consultation_fee, phone, email, joined_on)
SELECT UUID(), h.id,
       (SELECT MIN(u.id) FROM users u WHERE u.hospital_id = h.id AND u.access_role = 'ADMIN'),
       'Dr. A K Tripathi', 'MALE', 'DOCTOR',
       'Senior Physician & Surgeon - MBBS, MD (Medicine), MS (General Surgery), 22 yrs experience',
       'General Medicine & Surgery', 600.00, '9430012300',
       (SELECT u.email FROM users u WHERE u.hospital_id = h.id AND u.access_role = 'ADMIN' ORDER BY u.id LIMIT 1),
       DATE('2004-07-01')
FROM hospitals h
WHERE h.hospital_uid = '01a0de16-83b1-78bc-b8a1-da3e64610830'
  AND NOT EXISTS (SELECT 1 FROM staff s WHERE s.hospital_id = h.id AND s.staff_role = 'DOCTOR');

-- 8. Logins for Dr. Kavita Sinha (DOCTOR) and Sunita Devi (ADMIN), copying
--    phone and email from their staff rows. Replace the two placeholders with
--    bcrypt hashes of temporary passwords before running (production was seeded
--    on 2026-10-01; its hashes are deliberately not kept in this public repo).
INSERT INTO users (user_uid, hospital_id, user_name, phone, email, password_hash, access_role, is_super, is_active)
SELECT UUID(), h.id, s.full_name, s.phone, s.email, v.password_hash, v.access_role, FALSE, TRUE
FROM hospitals h
JOIN staff s ON s.hospital_id = h.id
JOIN (
    SELECT 'Dr. Kavita Sinha' AS full_name, 'DOCTOR' AS access_role,
           '<bcrypt-hash-for-kavita>' AS password_hash
    UNION ALL
    SELECT 'Sunita Devi', 'ADMIN',
           '<bcrypt-hash-for-sunita>'
) v ON v.full_name = s.full_name
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.phone = s.phone);

-- 9. Link those two staff rows to their new logins.
UPDATE staff s
JOIN hospitals h ON h.id = s.hospital_id
JOIN users u ON u.hospital_id = h.id AND u.phone = s.phone
SET s.user_id = u.id
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
  AND s.full_name IN ('Dr. Kavita Sinha', 'Sunita Devi')
  AND s.user_id IS NULL;

-- 10. Weekly OPD hours, 15-minute slots, Sundays off.
--     Dr. Kavita Sinha (Gynae):  Mon/Wed/Fri 10:00-14:00 (16), Tue/Thu/Sat 16:00-19:00 (12)
--     Dr. Rajeev Mishra (ENT):   Mon/Tue/Thu/Fri 11:00-14:00 (12), Sat 10:00-13:00 (12)
--     Dr. A K Tripathi:          Mon-Sat 09:00-13:00 (16), Mon-Fri 17:00-20:00 (12)
INSERT INTO staff_schedules (staff_id, hospital_id, weekday, start_time, end_time, max_patients)
SELECT s.id, s.hospital_id, v.weekday, v.start_time, v.end_time, v.max_patients
FROM staff s
JOIN hospitals h ON h.id = s.hospital_id
JOIN (
    SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9' AS hospital_uid, 'Dr. Kavita Sinha' AS full_name,
           0 AS weekday, TIME('10:00') AS start_time, TIME('14:00') AS end_time, 16 AS max_patients
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Kavita Sinha', 2, TIME('10:00'), TIME('14:00'), 16
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Kavita Sinha', 4, TIME('10:00'), TIME('14:00'), 16
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Kavita Sinha', 1, TIME('16:00'), TIME('19:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Kavita Sinha', 3, TIME('16:00'), TIME('19:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Kavita Sinha', 5, TIME('16:00'), TIME('19:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Rajeev Ranjan Mishra', 0, TIME('11:00'), TIME('14:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Rajeev Ranjan Mishra', 1, TIME('11:00'), TIME('14:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Rajeev Ranjan Mishra', 3, TIME('11:00'), TIME('14:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Rajeev Ranjan Mishra', 4, TIME('11:00'), TIME('14:00'), 12
    UNION ALL SELECT '01a0ddf6-562b-7bc3-b763-338c9a51e3d9', 'Dr. Rajeev Ranjan Mishra', 5, TIME('10:00'), TIME('13:00'), 12
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 0, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 1, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 2, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 3, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 4, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 5, TIME('09:00'), TIME('13:00'), 16
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 0, TIME('17:00'), TIME('20:00'), 12
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 1, TIME('17:00'), TIME('20:00'), 12
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 2, TIME('17:00'), TIME('20:00'), 12
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 3, TIME('17:00'), TIME('20:00'), 12
    UNION ALL SELECT '01a0de16-83b1-78bc-b8a1-da3e64610830', 'Dr. A K Tripathi', 4, TIME('17:00'), TIME('20:00'), 12
) v ON v.hospital_uid = h.hospital_uid AND v.full_name = s.full_name
WHERE s.staff_role = 'DOCTOR'
  AND NOT EXISTS (
      SELECT 1 FROM staff_schedules x
      WHERE x.staff_id = s.id AND x.weekday = v.weekday AND x.start_time = v.start_time
  );

COMMIT;

-- 11. Verify. Expect 4 rows: Kavita (Obstetrics & Gynaecology, 800, login
--     9430012312, 6 sessions), Rajeev (ENT, 700, no login, 5), Sunita (login
--     9430012313, 0) and Dr. A K Tripathi (General Medicine & Surgery, 600,
--     login akt, 11).
SELECT h.hospital_name, s.full_name, s.staff_role, s.department, s.consultation_fee,
       u.phone AS login, u.access_role,
       (SELECT COUNT(*) FROM staff_schedules x WHERE x.staff_id = s.id) AS sessions
FROM staff s
JOIN hospitals h ON h.id = s.hospital_id
LEFT JOIN users u ON u.id = s.user_id
WHERE s.staff_role = 'DOCTOR' OR s.user_id IS NOT NULL
ORDER BY h.hospital_name, s.full_name;

-- 12. Restore Workbench's safe-updates setting.
SET SQL_SAFE_UPDATES = @saved_safe_updates;
