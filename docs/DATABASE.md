# Database design (proposed)

MediZen currently has no database — doctors, the menu, and the [tse_ops](DEPLOYMENT.md) hospital
list all live in memory in the backend and reset on every restart. This is the proposed schema for
when that changes: a multi-hospital SaaS layout with an ORM-friendly, MySQL-flavored DDL.

## Conventions

| | |
|---|---|
| Primary key | `id` |
| Foreign key | `<entity>_id`, referencing that table's `id` |
| Timestamps | `created_at`, `modified_at` (auto-set, auto-updated) |

## Tables

### `hospitals`

```sql
CREATE TABLE hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state VARCHAR(100),
    city VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### `users` (login system)

```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(15) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role ENUM('ADMIN', 'RECEPTIONIST', 'DOCTOR') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
```

### `departments`

```sql
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
```

### `doctors`

```sql
CREATE TABLE doctors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dept_id INT NOT NULL,
    hospital_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (dept_id) REFERENCES departments(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
```

### `slot_groups` (token system)

```sql
CREATE TABLE slot_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doctor_id INT NOT NULL,
    hospital_id INT NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    max_patients INT NOT NULL,
    booked_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);
```

### `appointments`

```sql
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    doctor_id INT NOT NULL,
    slot_group_id INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    token_number INT NOT NULL,
    status ENUM('BOOKED', 'COMPLETED', 'NO_SHOW') DEFAULT 'BOOKED',
    created_by INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (slot_group_id) REFERENCES slot_groups(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

## Indexes

```sql
CREATE INDEX idx_users_hospital ON users(hospital_id);
CREATE INDEX idx_doctors_dept ON doctors(dept_id);
CREATE INDEX idx_slot_doctor_date ON slot_groups(doctor_id, date);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_slot ON appointments(slot_group_id);
```

## Constraints

One token per slot:

```sql
ALTER TABLE appointments
ADD CONSTRAINT unique_token_per_slot
UNIQUE (slot_group_id, token_number);
```

**Overbooking** is not enforced by a DB constraint — `slot_groups.max_patients` vs. `booked_count`
is a race condition under concurrent inserts. Handle it in the application layer instead, inside a
transaction: check `booked_count < max_patients`, assign the next `token_number`, insert the
appointment, then increment `booked_count`.

## Open questions for MediZen specifically

- **tse_ops → `hospitals`/`users`:** the [tse_ops onboarding UI](DEPLOYMENT.md) currently writes to
  an in-memory list (`backend/hospitals.py`) with a single admin username/password per hospital.
  Moving to this schema means: onboarding inserts into `hospitals` and one `users` row with
  `role = 'ADMIN'`, and `password_hash` replaces today's plaintext password.
- **Doctor data:** `backend/doctor_agent/doctors_data.py` is currently a hardcoded list, not scoped
  to a hospital. Migrating it means backfilling `hospital_id` / `dept_id` for existing doctors.
- **Auth:** `backend/auth.py`'s single demo login would be replaced by `users` rows (phone +
  password hash) once this schema is in place.
