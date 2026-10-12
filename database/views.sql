-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- Standalone SQL Views for DBS Lab Evaluation
-- ==============================================================

-- 1. Student Timetable View
CREATE OR REPLACE VIEW view_student_timetable AS
SELECT 
    t.student_id,
    s.name AS student_name,
    t.course_id,
    c.title AS course_title,
    sec.section_id,
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
CREATE OR REPLACE VIEW view_section_summary AS
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
