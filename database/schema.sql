-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- Relational Database Schema (3NF) - ANSI SQL / PostgreSQL / MySQL
-- ==============================================================

-- 1. DEPARTMENT TABLE
CREATE TABLE department (
    dept_name VARCHAR(50) PRIMARY KEY,
    building VARCHAR(50) NOT NULL,
    budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0)
);

-- 2. USER ACCOUNT TABLE (Authentication & Role-Based Access Control)
CREATE TABLE user_account (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENT TABLE
CREATE TABLE student (
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
CREATE TABLE instructor (
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
CREATE TABLE classroom (
    building VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    PRIMARY KEY (building, room_number)
);

-- 6. COURSE TABLE
CREATE TABLE course (
    course_id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0 AND credits <= 10),
    CONSTRAINT fk_course_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- 7. PREREQUISITE TABLE
CREATE TABLE prereq (
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
CREATE TABLE time_slot (
    time_slot_id VARCHAR(20) PRIMARY KEY,
    day VARCHAR(15) NOT NULL CHECK (day IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CONSTRAINT chk_time_window CHECK (start_time < end_time)
);

-- 9. SECTION TABLE
CREATE TABLE section (
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
CREATE TABLE teaches (
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

-- 11. TAKES TABLE (Registration & Grades)
CREATE TABLE takes (
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

-- ==============================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ==============================================================
CREATE INDEX idx_student_dept ON student(dept_name);
CREATE INDEX idx_course_dept ON course(dept_name);
CREATE INDEX idx_section_timeslot ON section(time_slot_id);
CREATE INDEX idx_section_room ON section(building, room_number);
CREATE INDEX idx_takes_student_term ON takes(student_id, semester, year);
CREATE INDEX idx_takes_section_term ON takes(course_id, section_id, semester, year);
CREATE INDEX idx_teaches_instructor ON teaches(instructor_id);

-- ==============================================================
-- DATABASE VIEWS
-- ==============================================================

-- 1. Student Timetable View
CREATE VIEW view_student_timetable AS
SELECT 
    t.student_id,
    s.name AS student_name,
    t.course_id,
    c.title AS course_title,
    t.section_id,
    t.semester,
    t.year,
    c.credits,
    ts.day,
    ts.start_time,
    ts.end_time,
    sec.building,
    sec.room_number,
    COALESCE(i.name, 'Unassigned') AS instructor_name,
    t.grade
FROM takes t
JOIN student s ON t.student_id = s.student_id
JOIN course c ON t.course_id = c.course_id
JOIN section sec ON t.course_id = sec.course_id 
    AND t.section_id = sec.section_id 
    AND t.semester = sec.semester 
    AND t.year = sec.year
JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id
LEFT JOIN teaches tch ON sec.course_id = tch.course_id 
    AND sec.section_id = tch.section_id 
    AND sec.semester = tch.semester 
    AND sec.year = tch.year
LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id;

-- 2. Section Enrollment Summary View
CREATE VIEW view_section_summary AS
SELECT 
    sec.course_id,
    c.title AS course_title,
    sec.section_id,
    sec.semester,
    sec.year,
    c.dept_name,
    c.credits,
    sec.building,
    sec.room_number,
    sec.time_slot_id,
    ts.day,
    ts.start_time,
    ts.end_time,
    sec.capacity,
    COUNT(t.student_id) AS enrolled_count,
    (sec.capacity - COUNT(t.student_id)) AS available_seats,
    COALESCE(i.name, 'Unassigned') AS instructor_name
FROM section sec
JOIN course c ON sec.course_id = c.course_id
JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id
LEFT JOIN teaches tch ON sec.course_id = tch.course_id 
    AND sec.section_id = tch.section_id 
    AND sec.semester = tch.semester 
    AND sec.year = tch.year
LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id
LEFT JOIN takes t ON sec.course_id = t.course_id 
    AND sec.section_id = t.section_id 
    AND sec.semester = t.semester 
    AND sec.year = t.year
GROUP BY 
    sec.course_id, c.title, sec.section_id, sec.semester, sec.year,
    c.dept_name, c.credits, sec.building, sec.room_number, sec.time_slot_id,
    ts.day, ts.start_time, ts.end_time, sec.capacity, i.name;
