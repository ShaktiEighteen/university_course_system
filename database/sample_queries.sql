-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- 10 DBS LAB DEMONSTRATION QUERIES
-- Demonstrating Joins, Aggregations, Group By, Subqueries, & Window Functions
-- ==============================================================

-- QUERY 1: INNER JOIN (Multi-Table Schedule)
-- Retrieve the complete weekly schedule for student 'S1001' in Fall 2026.
SELECT 
    s.student_id,
    s.name AS student_name,
    c.course_id,
    c.title,
    sec.section_id,
    ts.day,
    ts.start_time,
    ts.end_time,
    sec.building,
    sec.room_number,
    i.name AS instructor_name
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
LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id
WHERE t.student_id = 'S1001' AND t.semester = 'Fall' AND t.year = 2026
ORDER BY ts.day, ts.start_time;

-- QUERY 2: AGGREGATE WITH GROUP BY AND HAVING
-- Find departments where the average instructor salary exceeds $90,000, 
-- alongside total department faculty count and highest salary.
SELECT 
    dept_name,
    COUNT(instructor_id) AS faculty_count,
    ROUND(AVG(salary), 2) AS avg_salary,
    MAX(salary) AS max_salary
FROM instructor
GROUP BY dept_name
HAVING AVG(salary) >= 90000.00
ORDER BY avg_salary DESC;

-- QUERY 3: LEFT OUTER JOIN
-- List all courses along with total sections offered in Fall 2026, 
-- including courses with zero sections offered.
SELECT 
    c.course_id,
    c.title,
    c.dept_name,
    c.credits,
    COUNT(s.section_id) AS sections_offered
FROM course c
LEFT JOIN section s ON c.course_id = s.course_id 
    AND s.semester = 'Fall' 
    AND s.year = 2026
GROUP BY c.course_id, c.title, c.dept_name, c.credits
ORDER BY sections_offered DESC, c.course_id;

-- QUERY 4: SUBQUERY IN WHERE CLAUSE (NOT IN / PREREQUISITE ELIGIBILITY)
-- Find all students who have NOT completed 'CS101' with a passing grade.
SELECT 
    student_id,
    name,
    dept_name,
    tot_cred
FROM student
WHERE student_id NOT IN (
    SELECT student_id 
    FROM takes 
    WHERE course_id = 'CS101' 
      AND grade IN ('A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'P')
)
ORDER BY student_id;

-- QUERY 5: CORRELATED SUBQUERY (EXISTS)
-- Find instructors who are assigned to teach at least two distinct sections in Fall 2026.
SELECT 
    i.instructor_id,
    i.name,
    i.dept_name
FROM instructor i
WHERE (
    SELECT COUNT(*) 
    FROM teaches t
    WHERE t.instructor_id = i.instructor_id 
      AND t.semester = 'Fall' 
      AND t.year = 2026
) >= 2;

-- QUERY 6: DERIVED TABLE (SUBQUERY IN FROM) & PERCENTAGE CAPACITY
-- Calculate seat utilization percentage for every section in Fall 2026.
SELECT 
    util.course_id,
    util.title,
    util.section_id,
    util.capacity,
    util.enrolled,
    ROUND((util.enrolled * 100.0 / util.capacity), 1) AS occupancy_pct
FROM (
    SELECT 
        sec.course_id,
        c.title,
        sec.section_id,
        sec.capacity,
        COUNT(t.student_id) AS enrolled
    FROM section sec
    JOIN course c ON sec.course_id = c.course_id
    LEFT JOIN takes t ON sec.course_id = t.course_id 
        AND sec.section_id = t.section_id 
        AND sec.semester = t.semester 
        AND sec.year = t.year
    WHERE sec.semester = 'Fall' AND sec.year = 2026
    GROUP BY sec.course_id, c.title, sec.section_id, sec.capacity
) AS util
ORDER BY occupancy_pct DESC;

-- QUERY 7: SET OPERATION (UNION / INTERSECT)
-- Find all course IDs offered in BOTH Spring 2026 and Fall 2026.
SELECT course_id FROM section WHERE semester = 'Spring' AND year = 2026
INTERSECT
SELECT course_id FROM section WHERE semester = 'Fall' AND year = 2026;

-- QUERY 8: CONDITIONAL AGGREGATION (CASE STATEMENT)
-- Produce a breakdown of student distribution by total credits (Freshman, Sophomore, Junior, Senior) per department.
SELECT 
    dept_name,
    COUNT(student_id) AS total_students,
    SUM(CASE WHEN tot_cred < 20 THEN 1 ELSE 0 END) AS freshman_count,
    SUM(CASE WHEN tot_cred >= 20 AND tot_cred < 40 THEN 1 ELSE 0 END) AS sophomore_count,
    SUM(CASE WHEN tot_cred >= 40 AND tot_cred < 60 THEN 1 ELSE 0 END) AS junior_count,
    SUM(CASE WHEN tot_cred >= 60 THEN 1 ELSE 0 END) AS senior_count
FROM student
GROUP BY dept_name
ORDER BY total_students DESC;

-- QUERY 9: CLASSROOM CONFLICT AUDIT (Self-Join to Detect Collisions)
-- Verify that no classroom has been assigned to multiple sections during overlapping time slots in Fall 2026.
SELECT 
    s1.building,
    s1.room_number,
    s1.course_id AS course_1,
    s1.section_id AS sec_1,
    s2.course_id AS course_2,
    s2.section_id AS sec_2,
    ts1.day,
    ts1.start_time AS start_1,
    ts1.end_time AS end_1,
    ts2.start_time AS start_2,
    ts2.end_time AS end_2
FROM section s1
JOIN section s2 ON s1.building = s2.building 
    AND s1.room_number = s2.room_number
    AND s1.semester = s2.semester 
    AND s1.year = s2.year
    AND (s1.course_id <> s2.course_id OR s1.section_id <> s2.section_id)
JOIN time_slot ts1 ON s1.time_slot_id = ts1.time_slot_id
JOIN time_slot ts2 ON s2.time_slot_id = ts2.time_slot_id
WHERE s1.semester = 'Fall' AND s1.year = 2026
  AND ts1.day = ts2.day
  AND ts1.start_time < ts2.end_time 
  AND ts1.end_time > ts2.start_time;

-- QUERY 10: WINDOW FUNCTION (RANK / DENSE_RANK)
-- Rank students by total credits earned within their respective departments.
SELECT 
    student_id,
    name,
    dept_name,
    tot_cred,
    DENSE_RANK() OVER (PARTITION BY dept_name ORDER BY tot_cred DESC) AS dept_rank
FROM student
ORDER BY dept_name, dept_rank;
