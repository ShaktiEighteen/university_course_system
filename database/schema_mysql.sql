-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- MySQL Schema (InnoDB) with Triggers & Stored Procedures
-- ==============================================================

CREATE DATABASE IF NOT EXISTS university_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE university_db;

-- 1. DEPARTMENT
CREATE TABLE IF NOT EXISTS department (
    dept_name VARCHAR(50) PRIMARY KEY,
    building VARCHAR(50) NOT NULL,
    budget DECIMAL(12, 2) NOT NULL CHECK (budget >= 0)
) ENGINE=InnoDB;

-- 2. USER ACCOUNT
CREATE TABLE IF NOT EXISTS user_account (
    user_id VARCHAR(50) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'instructor', 'admin')),
    email VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 3. STUDENT
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
) ENGINE=InnoDB;

-- 4. INSTRUCTOR
CREATE TABLE IF NOT EXISTS instructor (
    instructor_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    salary DECIMAL(10, 2) NOT NULL CHECK (salary >= 0),
    user_id VARCHAR(50) UNIQUE,
    CONSTRAINT fk_instructor_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_instructor_user FOREIGN KEY (user_id) 
        REFERENCES user_account(user_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. CLASSROOM
CREATE TABLE IF NOT EXISTS classroom (
    building VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL CHECK (capacity > 0),
    PRIMARY KEY (building, room_number)
) ENGINE=InnoDB;

-- 6. COURSE
CREATE TABLE IF NOT EXISTS course (
    course_id VARCHAR(20) PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    dept_name VARCHAR(50) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0 AND credits <= 10),
    CONSTRAINT fk_course_dept FOREIGN KEY (dept_name) 
        REFERENCES department(dept_name) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 7. PREREQUISITE
CREATE TABLE IF NOT EXISTS prereq (
    course_id VARCHAR(20) NOT NULL,
    prereq_id VARCHAR(20) NOT NULL,
    PRIMARY KEY (course_id, prereq_id),
    CONSTRAINT fk_prereq_course FOREIGN KEY (course_id) 
        REFERENCES course(course_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_prereq_requirement FOREIGN KEY (prereq_id) 
        REFERENCES course(course_id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 8. TIME SLOT
CREATE TABLE IF NOT EXISTS time_slot (
    time_slot_id VARCHAR(20) PRIMARY KEY,
    day VARCHAR(15) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
) ENGINE=InnoDB;

-- 9. SECTION
CREATE TABLE IF NOT EXISTS section (
    course_id VARCHAR(20) NOT NULL,
    section_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
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
) ENGINE=InnoDB;

-- 10. TEACHES
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
) ENGINE=InnoDB;

-- 11. TAKES
CREATE TABLE IF NOT EXISTS takes (
    student_id VARCHAR(20) NOT NULL,
    course_id VARCHAR(20) NOT NULL,
    section_id VARCHAR(20) NOT NULL,
    semester VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    grade VARCHAR(5),
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, course_id, section_id, semester, year),
    CONSTRAINT fk_takes_student FOREIGN KEY (student_id) 
        REFERENCES student(student_id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_takes_section FOREIGN KEY (course_id, section_id, semester, year) 
        REFERENCES section(course_id, section_id, semester, year) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

-- ==============================================================
-- TRIGGER: ENFORCE SECTION CAPACITY
-- ==============================================================
DELIMITER //
CREATE TRIGGER before_takes_insert_capacity_check
BEFORE INSERT ON takes
FOR EACH ROW
BEGIN
    DECLARE v_cap INT;
    DECLARE v_curr INT;

    SELECT capacity INTO v_cap 
    FROM section 
    WHERE course_id = NEW.course_id 
      AND section_id = NEW.section_id 
      AND semester = NEW.semester 
      AND year = NEW.year;

    SELECT COUNT(*) INTO v_curr 
    FROM takes 
    WHERE course_id = NEW.course_id 
      AND section_id = NEW.section_id 
      AND semester = NEW.semester 
      AND year = NEW.year;

    IF v_curr >= v_cap THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Registration rejected: Course section capacity limit exceeded.';
    END IF;
END //
DELIMITER ;
