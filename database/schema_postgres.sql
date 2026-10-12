-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- PostgreSQL Schema with Triggers & Stored Procedures
-- ==============================================================

\c university_db;

-- 1. DEPARTMENT TABLE
CREATE TABLE IF NOT EXISTS department (
    dept_name VARCHAR(50) PRIMARY KEY,
    building VARCHAR(50) NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0)
);

-- 2. USER ACCOUNT TABLE
CREATE TABLE IF NOT EXISTS user_account (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENT TABLE
CREATE TABLE IF NOT EXISTS student (
    student_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    tot_cred INT DEFAULT 0 CHECK (tot_cred >= 0),
    user_id VARCHAR(50) UNIQUE,
    CONSTRAINT fk_student_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_student_user FOREIGN KEY (user_id) 
        REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 4. INSTRUCTOR TABLE
CREATE TABLE IF NOT EXISTS instructor (
    instructor_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    salary NUMERIC(10, 2) NOT NULL CHECK (salary >= 0),
    user_id VARCHAR(50) UNIQUE,
    CONSTRAINT fk_instructor_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_instructor_user FOREIGN KEY (user_id) 
        REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE SET NULL
);

-- 5. CLASSROOM TABLE
CREATE TABLE IF NOT EXISTS classroom (
    building VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    PRIMARY KEY (building, room_number)
);

-- 6. COURSE TABLE
CREATE TABLE IF NOT EXISTS course (
    course_id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0 AND credits <= 10),
    CONSTRAINT fk_course_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 7. PREREQUISITE TABLE
CREATE TABLE IF NOT EXISTS prereq (
    course_id VARCHAR(20) NOT NULL,
    prereq_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (course_id, prereq_id),
    CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_prereq_requirement FOREIGN KEY (prereq_id) 
        REFERENCES course(course_id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_prereq_distinct CHECK (course_id <> prereq_id)
);

-- 8. TIME SLOT TABLE
CREATE TABLE IF NOT EXISTS time_slot (
    time_slot_id VARCHAR(20) PRIMARY KEY,
    day VARCHAR(15) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_time_window CHECK (start_time < end_time)
);

-- 9. SECTION TABLE
CREATE TABLE IF NOT EXISTS section (
    course_id VARCHAR(20) NOT NULL,
    section_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL CHECK (semester IN ('Fall', 'Spring', 'Summer', 'Winter')),
    year INT NOT NULL CHECK (year >= 2000 AND year <= 2100),
    building VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    time_slot_id VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    PRIMARY KEY (course_id, section_id, semester, year),
    CONSTRAINT fk_section_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_section_classroom FOREIGN KEY (building, room_number) 
        REFERENCES classroom(building, room_number) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_section_timeslot FOREIGN KEY (time_slot_id) 
        REFERENCES time_slot(time_slot_id) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 10. TEACHES TABLE
CREATE TABLE IF NOT EXISTS teaches (
    instructor_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    section_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    PRIMARY KEY (instructor_id, course_id, section_id, semester, year),
    CONSTRAINT fk_teaches_instructor FOREIGN KEY (instructor_id) 
        REFERENCES instructor(instructor_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_teaches_section FOREIGN KEY (course_id, section_id, semester, year) 
        REFERENCES section(course_id, section_id, semester, year) ON UPDATE CASCADE ON DELETE CASCADE
);

-- 11. TAKES TABLE
CREATE TABLE IF NOT EXISTS takes (
    student_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    section_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    grade VARCHAR(5) CHECK (grade IS NULL OR grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F', 'W', 'P', 'IP')),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id, section_id, semester, year),
    CONSTRAINT fk_takes_student FOREIGN KEY (student_id) 
        REFERENCES student(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_takes_section FOREIGN KEY (course_id, section_id, semester, year) 
        REFERENCES section(course_id, section_id, semester, year) ON UPDATE CASCADE ON DELETE CASCADE
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_student_dept ON student(dept_name);
CREATE INDEX IF NOT EXISTS idx_course_dept ON course(dept_name);
CREATE INDEX IF NOT EXISTS idx_section_timeslot ON section(time_slot_id);
CREATE INDEX IF NOT EXISTS idx_section_room ON section(building, room_number);
CREATE INDEX IF NOT EXISTS idx_takes_student_term ON takes(student_id, semester, year);
CREATE INDEX IF NOT EXISTS idx_takes_section_term ON takes(course_id, section_id, semester, year);

-- ==============================================================
-- TRIGGER: BLOCK REGISTRATION WHEN SECTION CAPACITY IS REACHED
-- ==============================================================
CREATE OR REPLACE FUNCTION trg_check_section_capacity()
RETURNS TRIGGER AS $$
DECLARE
    v_capacity INT;
    v_enrolled INT;
BEGIN
    SELECT capacity INTO v_capacity
    FROM section
    WHERE course_id = NEW.course_id
      AND section_id = NEW.section_id
      AND semester = NEW.semester
      AND year = NEW.year;

    SELECT COUNT(*) INTO v_enrolled
    FROM takes
    WHERE course_id = NEW.course_id
      AND section_id = NEW.section_id
      AND semester = NEW.semester
      AND year = NEW.year;

    IF v_enrolled >= v_capacity THEN
        RAISE EXCEPTION 'Registration rejected: Section %-% (% %) is full (Capacity: %, Enrolled: %)', 
            NEW.course_id, NEW.section_id, NEW.semester, NEW.year, v_capacity, v_enrolled;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_capacity_before_registration ON takes;
CREATE TRIGGER check_capacity_before_registration
BEFORE INSERT ON takes
FOR EACH ROW
EXECUTE FUNCTION trg_check_section_capacity();

-- ==============================================================
-- STORED PROCEDURE: TRANSACTIONAL COURSE REGISTRATION
-- ==============================================================
CREATE OR REPLACE PROCEDURE register_student_sp(
    p_student_id VARCHAR,
    p_course_id VARCHAR,
    p_section_id VARCHAR,
    p_semester VARCHAR,
    p_year INT,
    OUT p_status_code INT,
    OUT p_message VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_course_credits INT;
    v_current_credits INT;
    v_unmet_prereq VARCHAR;
    v_clash_course VARCHAR;
    v_capacity INT;
    v_enrolled INT;
BEGIN
    -- 1. Check if course exists
    SELECT credits INTO v_course_credits FROM course WHERE course_id = p_course_id;
    IF NOT FOUND THEN
        p_status_code := 404;
        p_message := 'Course not found.';
        RETURN;
    END IF;

    -- 2. Check if student already enrolled in this course for the semester
    IF EXISTS (
        SELECT 1 FROM takes 
        WHERE student_id = p_student_id 
          AND course_id = p_course_id 
          AND semester = p_semester 
          AND year = p_year
    ) THEN
        p_status_code := 400;
        p_message := 'Already registered for this course in the current semester.';
        RETURN;
    END IF;

    -- 3. Check credit limit (Max 18 credits)
    SELECT COALESCE(SUM(c.credits), 0) INTO v_current_credits
    FROM takes t
    JOIN course c ON t.course_id = c.course_id
    WHERE t.student_id = p_student_id
      AND t.semester = p_semester
      AND t.year = p_year;

    IF (v_current_credits + v_course_credits) > 18 THEN
        p_status_code := 400;
        p_message := FORMAT('Credit limit exceeded: Registered %s, adding %s exceeds max 18 credits.', v_current_credits, v_course_credits);
        RETURN;
    END IF;

    -- 4. Check prerequisites
    SELECT p.prereq_id INTO v_unmet_prereq
    FROM prereq p
    WHERE p.course_id = p_course_id
      AND NOT EXISTS (
          SELECT 1 FROM takes past
          WHERE past.student_id = p_student_id
            AND past.course_id = p.prereq_id
            AND past.grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'P')
      )
    LIMIT 1;

    IF v_unmet_prereq IS NOT NULL THEN
        p_status_code := 400;
        p_message := FORMAT('Prerequisite requirement not satisfied: Must complete %s with passing grade.', v_unmet_prereq);
        RETURN;
    END IF;

    -- 5. Check Time Slot Clash
    SELECT t_existing.course_id INTO v_clash_course
    FROM takes t_existing
    JOIN section s_existing ON t_existing.course_id = s_existing.course_id 
        AND t_existing.section_id = s_existing.section_id
        AND t_existing.semester = s_existing.semester
        AND t_existing.year = s_existing.year
    JOIN time_slot ts_existing ON s_existing.time_slot_id = ts_existing.time_slot_id
    JOIN section s_target ON s_target.course_id = p_course_id
        AND s_target.section_id = p_section_id
        AND s_target.semester = p_semester
        AND s_target.year = p_year
    JOIN time_slot ts_target ON s_target.time_slot_id = ts_target.time_slot_id
    WHERE t_existing.student_id = p_student_id
      AND t_existing.semester = p_semester
      AND t_existing.year = p_year
      AND ts_existing.day = ts_target.day
      AND (ts_existing.start_time < ts_target.end_time AND ts_existing.end_time > ts_target.start_time)
    LIMIT 1;

    IF v_clash_course IS NOT NULL THEN
        p_status_code := 400;
        p_message := FORMAT('Time slot clash detected with already enrolled course %s.', v_clash_course);
        RETURN;
    END IF;

    -- 6. Check Capacity with lock
    SELECT capacity INTO v_capacity
    FROM section
    WHERE course_id = p_course_id AND section_id = p_section_id AND semester = p_semester AND year = p_year
    FOR UPDATE;

    SELECT COUNT(*) INTO v_enrolled
    FROM takes
    WHERE course_id = p_course_id AND section_id = p_section_id AND semester = p_semester AND year = p_year;

    IF v_enrolled >= v_capacity THEN
        p_status_code := 400;
        p_message := FORMAT('Section is full (%s / %s seats taken).', v_enrolled, v_capacity);
        RETURN;
    END IF;

    -- 7. Insert registration
    INSERT INTO takes (student_id, course_id, section_id, semester, year, grade)
    VALUES (p_student_id, p_course_id, p_section_id, p_semester, p_year, 'IP');

    p_status_code := 200;
    p_message := 'Registration successful.';
END;
$$;
