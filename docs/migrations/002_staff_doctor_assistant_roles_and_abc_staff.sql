-- Migration 002: allow DOCTOR and ASSISTANT staff roles, then seed six
-- dummy staff for hospital "ABC".
--
-- Safe to run more than once (the ALTER re-applies the same definition, and
-- each seed row is skipped if a staff member with that name already exists
-- under the facility). Run each statement on its own in MySQL Workbench
-- (Ctrl+Enter).
--
-- DOCTOR here is a staff-directory entry only, with no login. A doctor who
-- needs to sign in, have slots and take appointments still needs a `users`
-- row (access_role DOCTOR) plus a `doctors` row.
--
-- The seed people are DUMMY data: names, phones, dates and credentials are
-- made up, and emails use the reserved example.com domain.

-- 1. Add the two roles. Existing values keep their order; new ones go last.
ALTER TABLE staff
  MODIFY staff_role ENUM('NURSE','ADMIN_STAFF','RECEPTIONIST','TECHNICIAN','PHARMACIST','OTHER','DOCTOR','ASSISTANT') NOT NULL;

-- 2. Check the target facility. Expect one row named ABC.
SELECT id, hospital_uid, hospital_name, org_type
FROM hospitals
WHERE hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9';

-- 3. ABC's staff: 2 doctors (ENT, Gynaecology), a head administrator who is
--    also the senior nurse, 2 newly joined nurses, and an OT/office assistant.
INSERT INTO staff (staff_uid, hospital_id, full_name, gender, staff_role, designation, phone, email, joined_on)
SELECT UUID(), h.id, v.full_name, v.gender, v.staff_role, v.designation, v.phone, v.email, v.joined_on
FROM hospitals h
JOIN (
    SELECT 'Dr. Rajeev Ranjan Mishra' AS full_name, 'MALE' AS gender, 'DOCTOR' AS staff_role,
           'Senior Consultant, ENT - MS (ENT), 18 yrs experience' AS designation, '9430012311' AS phone,
           'rajeev@gmail.com' AS email, DATE('2014-06-02') AS joined_on
    UNION ALL
    SELECT 'Dr. Kavita Sinha', 'FEMALE', 'DOCTOR',
           'Head of Obstetrics & Gynaecology - MD, DGO, FICOG, 26 yrs, FOGSI Best Clinician Award', '9430012312',
           'kavita@gmail.com', DATE('2009-03-16')
    UNION ALL
    SELECT 'Sunita Devi', 'FEMALE', 'ADMIN_STAFF',
           'Head Administrator (Staff) & Senior Nurse', '9430012313',
           'sunita@gmail.com', DATE('2011-08-01')
    UNION ALL
    SELECT 'Neha Kumari', 'FEMALE', 'NURSE',
           'Staff Nurse (joined 2026)', '9430012314',
           'neha@gmail.com', DATE('2026-08-03')
    UNION ALL
    SELECT 'Vikash Kumar', 'MALE', 'NURSE',
           'Staff Nurse (joined 2026)', '9430012315',
           'vikash@gmail.com', DATE('2026-09-01')
    UNION ALL
    SELECT 'Manoj Kumar', 'MALE', 'ASSISTANT',
           'OT & Office Assistant', '9430012316',
           'manoj@gmail.com', DATE('2017-11-20')
) v
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
  AND NOT EXISTS (
      SELECT 1 FROM staff s WHERE s.hospital_id = h.id AND s.full_name = v.full_name
  );

COMMIT;

-- 4. Verify: expect 6 rows.
SELECT s.full_name, s.gender, s.staff_role, s.designation, s.phone, s.joined_on
FROM staff s
JOIN hospitals h ON h.id = s.hospital_id
WHERE h.hospital_uid = '01a0ddf6-562b-7bc3-b763-338c9a51e3d9'
ORDER BY s.staff_role, s.full_name;
