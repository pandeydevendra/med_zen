-- Migration 001: add the `staff` table, then seed Dr. AKT's clinic staff.
--
-- Safe to run more than once (CREATE ... IF NOT EXISTS, and each seed row
-- is skipped if a staff member with that name already exists under the
-- facility). Run each statement on its own in MySQL Workbench (Ctrl+Enter).
--
-- The seed people below are SAMPLE data: names, phones and joining dates
-- are made up, and emails use the reserved example.com domain. Replace them
-- with the real staff details before relying on them.

-- 1. STAFF — facility personnel who don't sign in to MediZen. Same
--    definition as section 5b of docs/mysql_scrpt.sql.
CREATE TABLE IF NOT EXISTS staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_uid VARCHAR(36) NOT NULL UNIQUE,
    hospital_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    gender ENUM('MALE','FEMALE','OTHER') NULL,
    staff_role ENUM('NURSE','ADMIN_STAFF','RECEPTIONIST','TECHNICIAN','PHARMACIST','OTHER') NOT NULL,
    designation VARCHAR(100) NULL,
    phone VARCHAR(32) NULL,
    email VARCHAR(255) NULL,
    joined_on DATE NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_staff_hospital (hospital_id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- 2. Check Dr. AKT's facility exists under this exact name. If this returns
--    no row, change 'Dr. A K Tripathi' in step 3 to the name it was onboarded with.
SELECT id, hospital_uid, hospital_name, org_type
FROM hospitals
WHERE hospital_name = 'Dr. A K Tripathi' AND org_type != 'PLATFORM';

-- 3. Dr. AKT's clinic staff: two male nurses, one female nurse, one admin staff.
--    Dr. AKT is a physician who also operates, so one nurse is an OT nurse.
INSERT INTO staff (staff_uid, hospital_id, full_name, gender, staff_role, designation, phone, email, joined_on)
SELECT UUID(), h.id, v.full_name, v.gender, v.staff_role, v.designation, v.phone, v.email, v.joined_on
FROM hospitals h
JOIN (
    SELECT 'Ravi Kumar Singh' AS full_name, 'MALE' AS gender, 'NURSE' AS staff_role,
           'Senior Staff Nurse (OT)' AS designation, '9430012301' AS phone,
           'ravi.singh@example.com' AS email, DATE('2019-04-15') AS joined_on
    UNION ALL
    SELECT 'Sanjay Kumar Yadav', 'MALE', 'NURSE',
           'Staff Nurse', '9430012302',
           'sanjay.yadav@example.com', DATE('2021-07-01')
    UNION ALL
    SELECT 'Priya Kumari', 'FEMALE', 'NURSE',
           'Staff Nurse', '9430012303',
           'priya.kumari@example.com', DATE('2022-01-10')
    UNION ALL
    SELECT 'Amit Ranjan Sinha', 'MALE', 'ADMIN_STAFF',
           'Clinic Administrator', '9430012304',
           'amit.sinha@example.com', DATE('2020-09-21')
) v
WHERE h.hospital_name = 'Dr. A K Tripathi'
  AND h.org_type != 'PLATFORM'
  AND NOT EXISTS (
      SELECT 1 FROM staff s WHERE s.hospital_id = h.id AND s.full_name = v.full_name
  );

COMMIT;

-- 4. Verify: expect 4 rows.
SELECT s.full_name, s.gender, s.staff_role, s.designation, s.phone, s.email, s.joined_on
FROM staff s
JOIN hospitals h ON h.id = s.hospital_id
WHERE h.hospital_name = 'Dr. A K Tripathi'
ORDER BY s.staff_role, s.full_name;
