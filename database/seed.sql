-- ==============================================================
-- UNIVERSITY COURSE REGISTRATION & MANAGEMENT SYSTEM
-- Seed Data: 5 Departments, 17 Courses, 10 Instructors, 32 Students, 22 Sections
-- Default Passwords:
-- Admin:      admin / admin123
-- Instructor: inst_cs101 / teach123 (etc.)
-- Student:    stud_cs01 / pass123 (etc.)
-- ==============================================================

-- 1. DEPARTMENTS (5)
INSERT INTO department (dept_name, building, budget) VALUES
('Computer Science', 'Turing Hall', 1200000.00),
('Electrical Eng', 'Tesla Complex', 950000.00),
('Mechanical Eng', 'Newton Complex', 850000.00),
('Mathematics', 'Ramanujan Block', 600000.00),
('Management', 'Smith Building', 750000.00);

-- 2. CLASSROOMS (8)
INSERT INTO classroom (building, room_number, capacity) VALUES
('Turing Hall', '101', 40),
('Turing Hall', '201', 35),
('Turing Hall', '301', 60),
('Tesla Complex', '105', 30),
('Tesla Complex', '205', 45),
('Newton Complex', '110', 50),
('Ramanujan Block', '101', 40),
('Smith Building', '202', 45);

-- 3. TIME SLOTS (10)
INSERT INTO time_slot (time_slot_id, day, start_time, end_time) VALUES
('TS-M1', 'Monday', '09:00:00', '10:30:00'),
('TS-M2', 'Monday', '11:00:00', '12:30:00'),
('TS-M3', 'Monday', '14:00:00', '15:30:00'),
('TS-T1', 'Tuesday', '09:00:00', '10:30:00'),
('TS-T2', 'Tuesday', '11:00:00', '12:30:00'),
('TS-W1', 'Wednesday', '09:00:00', '10:30:00'),
('TS-W2', 'Wednesday', '11:00:00', '12:30:00'),
('TS-TH1', 'Thursday', '09:00:00', '10:30:00'),
('TS-TH2', 'Thursday', '14:00:00', '15:30:00'),
('TS-F1', 'Friday', '10:00:00', '11:30:00');

-- 4. USER ACCOUNTS (Admin, 10 Instructors, 32 Students)
INSERT INTO user_account (user_id, username, password_hash, role, email) VALUES
('USR-ADMIN', 'admin', 'pbkdf2_sha256$1000000$hJYfn01pDqq2xeKQeaa6vT$2D1n6NjNTlSGw1fsk8+tHinaGzq4JPOC1eOMc/nF5DM=', 'admin', 'admin@univ.edu'),

-- Instructors
('USR-INS01', 'inst_cs101', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'alan.turing@univ.edu'),
('USR-INS02', 'inst_cs102', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'grace.hopper@univ.edu'),
('USR-INS03', 'inst_ee101', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'nikola.tesla@univ.edu'),
('USR-INS04', 'inst_ee102', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'claude.shannon@univ.edu'),
('USR-INS05', 'inst_me101', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'isaac.newton@univ.edu'),
('USR-INS06', 'inst_me102', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'james.watt@univ.edu'),
('USR-INS07', 'inst_ma101', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 's.ramanujan@univ.edu'),
('USR-INS08', 'inst_ma102', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'ada.lovelace@univ.edu'),
('USR-INS09', 'inst_mg101', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'adam.smith@univ.edu'),
('USR-INS10', 'inst_mg102', 'pbkdf2_sha256$1000000$R6lcTae347e2veaxmo05MO$NrbnVWNl3InIAKO3RUTN50/Gk1gbahU59xpYbYTPksQ=', 'instructor', 'peter.drucker@univ.edu'),

-- Students (32)
('USR-STU01', 'stud_cs01', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'alice.johnson@univ.edu'),
('USR-STU02', 'stud_cs02', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'bob.smith@univ.edu'),
('USR-STU03', 'stud_cs03', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'charlie.brown@univ.edu'),
('USR-STU04', 'stud_cs04', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'david.miller@univ.edu'),
('USR-STU05', 'stud_cs05', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'eva.green@univ.edu'),
('USR-STU06', 'stud_cs06', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'frank.wright@univ.edu'),
('USR-STU07', 'stud_cs07', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'grace.lee@univ.edu'),
('USR-STU08', 'stud_cs08', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'henry.adams@univ.edu'),
('USR-STU09', 'stud_ee01', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'ivy.chen@univ.edu'),
('USR-STU10', 'stud_ee02', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'jack.davis@univ.edu'),
('USR-STU11', 'stud_ee03', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'karen.wilson@univ.edu'),
('USR-STU12', 'stud_ee04', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'leo.martinez@univ.edu'),
('USR-STU13', 'stud_ee05', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'mona.patel@univ.edu'),
('USR-STU14', 'stud_ee06', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'noah.taylor@univ.edu'),
('USR-STU15', 'stud_me01', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'olivia.white@univ.edu'),
('USR-STU16', 'stud_me02', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'paul.harris@univ.edu'),
('USR-STU17', 'stud_me03', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'quinn.clark@univ.edu'),
('USR-STU18', 'stud_me04', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'rachel.lewis@univ.edu'),
('USR-STU19', 'stud_me05', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'sam.robinson@univ.edu'),
('USR-STU20', 'stud_me06', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'tara.walker@univ.edu'),
('USR-STU21', 'stud_ma01', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'umar.farooq@univ.edu'),
('USR-STU22', 'stud_ma02', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'victor.hall@univ.edu'),
('USR-STU23', 'stud_ma03', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'wendy.allen@univ.edu'),
('USR-STU24', 'stud_ma04', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'xavier.young@univ.edu'),
('USR-STU25', 'stud_ma05', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'yasmin.king@univ.edu'),
('USR-STU26', 'stud_mg01', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'zack.wright@univ.edu'),
('USR-STU27', 'stud_mg02', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'amber.scott@univ.edu'),
('USR-STU28', 'stud_mg03', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'brian.green@univ.edu'),
('USR-STU29', 'stud_mg04', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'chloe.baker@univ.edu'),
('USR-STU30', 'stud_mg05', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'danielle.nelson@univ.edu'),
('USR-STU31', 'stud_cs09', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'eric.carter@univ.edu'),
('USR-STU32', 'stud_cs10', 'pbkdf2_sha256$1000000$FnP2oX5LmI7Pqg6QFtsOy8$3LhtafYmGOKPlVBQzyiSWMwrMRfQ40//MmBMd0E8ykc=', 'student', 'fiona.mitchell@univ.edu');

-- 5. INSTRUCTORS (10)
INSERT INTO instructor (instructor_id, name, dept_name, salary, user_id) VALUES
('INS01', 'Dr. Alan Turing', 'Computer Science', 95000.00, 'USR-INS01'),
('INS02', 'Dr. Grace Hopper', 'Computer Science', 98000.00, 'USR-INS02'),
('INS03', 'Dr. Nikola Tesla', 'Electrical Eng', 92000.00, 'USR-INS03'),
('INS04', 'Dr. Claude Shannon', 'Electrical Eng', 89000.00, 'USR-INS04'),
('INS05', 'Dr. Isaac Newton', 'Mechanical Eng', 91000.00, 'USR-INS05'),
('INS06', 'Dr. James Watt', 'Mechanical Eng', 86000.00, 'USR-INS06'),
('INS07', 'Dr. Srinivasa Ramanujan', 'Mathematics', 94000.00, 'USR-INS07'),
('INS08', 'Dr. Ada Lovelace', 'Mathematics', 92000.00, 'USR-INS08'),
('INS09', 'Prof. Adam Smith', 'Management', 88000.00, 'USR-INS09'),
('INS10', 'Prof. Peter Drucker', 'Management', 87000.00, 'USR-INS10');

-- 6. STUDENTS (32)
INSERT INTO student (student_id, name, dept_name, tot_cred, user_id) VALUES
('S1001', 'Alice Johnson', 'Computer Science', 48, 'USR-STU01'),
('S1002', 'Bob Smith', 'Computer Science', 36, 'USR-STU02'),
('S1003', 'Charlie Brown', 'Computer Science', 24, 'USR-STU03'),
('S1004', 'David Miller', 'Computer Science', 60, 'USR-STU04'),
('S1005', 'Eva Green', 'Computer Science', 16, 'USR-STU05'),
('S1006', 'Frank Wright', 'Computer Science', 52, 'USR-STU06'),
('S1007', 'Grace Lee', 'Computer Science', 32, 'USR-STU07'),
('S1008', 'Henry Adams', 'Computer Science', 12, 'USR-STU08'),
('S1009', 'Ivy Chen', 'Electrical Eng', 44, 'USR-STU09'),
('S1010', 'Jack Davis', 'Electrical Eng', 28, 'USR-STU10'),
('S1011', 'Karen Wilson', 'Electrical Eng', 56, 'USR-STU11'),
('S1012', 'Leo Martinez', 'Electrical Eng', 20, 'USR-STU12'),
('S1013', 'Mona Patel', 'Electrical Eng', 36, 'USR-STU13'),
('S1014', 'Noah Taylor', 'Electrical Eng', 12, 'USR-STU14'),
('S1015', 'Olivia White', 'Mechanical Eng', 48, 'USR-STU15'),
('S1016', 'Paul Harris', 'Mechanical Eng', 32, 'USR-STU16'),
('S1017', 'Quinn Clark', 'Mechanical Eng', 64, 'USR-STU17'),
('S1018', 'Rachel Lewis', 'Mechanical Eng', 16, 'USR-STU18'),
('S1019', 'Sam Robinson', 'Mechanical Eng', 40, 'USR-STU19'),
('S1020', 'Tara Walker', 'Mechanical Eng', 24, 'USR-STU20'),
('S1021', 'Umar Farooq', 'Mathematics', 48, 'USR-STU21'),
('S1022', 'Victor Hall', 'Mathematics', 32, 'USR-STU22'),
('S1023', 'Wendy Allen', 'Mathematics', 60, 'USR-STU23'),
('S1024', 'Xavier Young', 'Mathematics', 16, 'USR-STU24'),
('S1025', 'Yasmin King', 'Mathematics', 40, 'USR-STU25'),
('S1026', 'Zack Wright', 'Management', 44, 'USR-STU26'),
('S1027', 'Amber Scott', 'Management', 28, 'USR-STU27'),
('S1028', 'Brian Green', 'Management', 52, 'USR-STU28'),
('S1029', 'Chloe Baker', 'Management', 16, 'USR-STU29'),
('S1030', 'Danielle Nelson', 'Management', 36, 'USR-STU30'),
('S1031', 'Eric Carter', 'Computer Science', 8, 'USR-STU31'),
('S1032', 'Fiona Mitchell', 'Computer Science', 8, 'USR-STU32');

-- 7. COURSES (17)
INSERT INTO course (course_id, title, dept_name, credits) VALUES
('CS101', 'Intro to Computer Science', 'Computer Science', 4),
('CS201', 'Data Structures & Algorithms', 'Computer Science', 4),
('CS202', 'Database Management Systems', 'Computer Science', 4),
('CS301', 'Design & Analysis of Algorithms', 'Computer Science', 3),
('CS302', 'Operating Systems', 'Computer Science', 4),
('CS401', 'Distributed Systems & Cloud', 'Computer Science', 3),
('EE101', 'Circuit Theory & Analysis', 'Electrical Eng', 4),
('EE201', 'Signals and Systems', 'Electrical Eng', 4),
('EE301', 'Digital Signal Processing', 'Electrical Eng', 3),
('ME101', 'Engineering Mechanics', 'Mechanical Eng', 4),
('ME201', 'Thermodynamics', 'Mechanical Eng', 4),
('ME301', 'Fluid Mechanics', 'Mechanical Eng', 3),
('MA101', 'Linear Algebra & Calculus', 'Mathematics', 4),
('MA201', 'Discrete Mathematics', 'Mathematics', 3),
('MA301', 'Probability & Statistics', 'Mathematics', 3),
('MG101', 'Principles of Management', 'Management', 3),
('MG201', 'Financial Accounting', 'Management', 3);

-- 8. PREREQUISITES
INSERT INTO prereq (course_id, prereq_id) VALUES
('CS201', 'CS101'),
('CS202', 'CS101'),
('CS301', 'CS201'),
('CS302', 'CS201'),
('CS401', 'CS301'),
('EE201', 'EE101'),
('EE301', 'EE201'),
('ME201', 'ME101'),
('ME301', 'ME201'),
('MA201', 'MA101'),
('MA301', 'MA101'),
('MG201', 'MG101');

-- 9. SECTIONS (22)
-- Fall 2026 (Active Current Term)
INSERT INTO section (course_id, section_id, semester, year, building, room_number, time_slot_id, capacity) VALUES
('CS101', 'SEC01', 'Fall', 2026, 'Turing Hall', '101', 'TS-M1', 40),
('CS101', 'SEC02', 'Fall', 2026, 'Turing Hall', '201', 'TS-T1', 35),
('CS201', 'SEC01', 'Fall', 2026, 'Turing Hall', '301', 'TS-M2', 40),
('CS202', 'SEC01', 'Fall', 2026, 'Turing Hall', '101', 'TS-W1', 35),
('CS301', 'SEC01', 'Fall', 2026, 'Turing Hall', '201', 'TS-TH1', 30),
('CS302', 'SEC01', 'Fall', 2026, 'Turing Hall', '301', 'TS-F1', 35),
('CS401', 'SEC01', 'Fall', 2026, 'Turing Hall', '201', 'TS-M3', 25),
('EE101', 'SEC01', 'Fall', 2026, 'Tesla Complex', '105', 'TS-M1', 30),
('EE201', 'SEC01', 'Fall', 2026, 'Tesla Complex', '205', 'TS-T2', 30),
('EE301', 'SEC01', 'Fall', 2026, 'Tesla Complex', '105', 'TS-TH2', 25),
('ME101', 'SEC01', 'Fall', 2026, 'Newton Complex', '110', 'TS-M2', 40),
('ME201', 'SEC01', 'Fall', 2026, 'Newton Complex', '110', 'TS-W2', 35),
('ME301', 'SEC01', 'Fall', 2026, 'Newton Complex', '110', 'TS-TH1', 30),
('MA101', 'SEC01', 'Fall', 2026, 'Ramanujan Block', '101', 'TS-M1', 35),
('MA201', 'SEC01', 'Fall', 2026, 'Ramanujan Block', '101', 'TS-T1', 35),
('MA301', 'SEC01', 'Fall', 2026, 'Ramanujan Block', '101', 'TS-W1', 30),
('MG101', 'SEC01', 'Fall', 2026, 'Smith Building', '202', 'TS-M3', 40),
('MG201', 'SEC01', 'Fall', 2026, 'Smith Building', '202', 'TS-TH2', 35),

-- Spring 2026 (Past Term)
('CS101', 'SEC01', 'Spring', 2026, 'Turing Hall', '101', 'TS-M1', 40),
('CS201', 'SEC01', 'Spring', 2026, 'Turing Hall', '301', 'TS-M2', 35),
('MA101', 'SEC01', 'Spring', 2026, 'Ramanujan Block', '101', 'TS-T1', 40),
('EE101', 'SEC01', 'Spring', 2026, 'Tesla Complex', '105', 'TS-W1', 30);

-- 10. TEACHES ASSIGNMENTS
INSERT INTO teaches (instructor_id, course_id, section_id, semester, year) VALUES
('INS01', 'CS101', 'SEC01', 'Fall', 2026),
('INS02', 'CS101', 'SEC02', 'Fall', 2026),
('INS01', 'CS201', 'SEC01', 'Fall', 2026),
('INS02', 'CS202', 'SEC01', 'Fall', 2026),
('INS01', 'CS301', 'SEC01', 'Fall', 2026),
('INS02', 'CS302', 'SEC01', 'Fall', 2026),
('INS01', 'CS401', 'SEC01', 'Fall', 2026),
('INS03', 'EE101', 'SEC01', 'Fall', 2026),
('INS04', 'EE201', 'SEC01', 'Fall', 2026),
('INS03', 'EE301', 'SEC01', 'Fall', 2026),
('INS05', 'ME101', 'SEC01', 'Fall', 2026),
('INS06', 'ME201', 'SEC01', 'Fall', 2026),
('INS05', 'ME301', 'SEC01', 'Fall', 2026),
('INS07', 'MA101', 'SEC01', 'Fall', 2026),
('INS08', 'MA201', 'SEC01', 'Fall', 2026),
('INS07', 'MA301', 'SEC01', 'Fall', 2026),
('INS09', 'MG101', 'SEC01', 'Fall', 2026),
('INS10', 'MG201', 'SEC01', 'Fall', 2026),
-- Spring 2026
('INS01', 'CS101', 'SEC01', 'Spring', 2026),
('INS02', 'CS201', 'SEC01', 'Spring', 2026),
('INS07', 'MA101', 'SEC01', 'Spring', 2026),
('INS03', 'EE101', 'SEC01', 'Spring', 2026);

-- 11. TAKES (Registrations & Grades)
-- Completed Spring 2026 courses (Providing prerequisites for students)
INSERT INTO takes (student_id, course_id, section_id, semester, year, grade) VALUES
('S1001', 'CS101', 'SEC01', 'Spring', 2026, 'A'),
('S1001', 'MA101', 'SEC01', 'Spring', 2026, 'A-'),
('S1002', 'CS101', 'SEC01', 'Spring', 2026, 'B+'),
('S1003', 'CS101', 'SEC01', 'Spring', 2026, 'B'),
('S1004', 'CS101', 'SEC01', 'Spring', 2026, 'A'),
('S1004', 'CS201', 'SEC01', 'Spring', 2026, 'A'),
('S1009', 'EE101', 'SEC01', 'Spring', 2026, 'A'),
('S1010', 'EE101', 'SEC01', 'Spring', 2026, 'B');

-- Active Fall 2026 Registrations (In Progress 'IP' or Registered)
INSERT INTO takes (student_id, course_id, section_id, semester, year, grade) VALUES
('S1001', 'CS201', 'SEC01', 'Fall', 2026, 'IP'),
('S1001', 'CS202', 'SEC01', 'Fall', 2026, 'IP'),
('S1002', 'CS201', 'SEC01', 'Fall', 2026, 'IP'),
('S1003', 'CS101', 'SEC02', 'Fall', 2026, 'IP'),
('S1004', 'CS301', 'SEC01', 'Fall', 2026, 'IP'),
('S1005', 'CS101', 'SEC01', 'Fall', 2026, 'IP'),
('S1006', 'CS202', 'SEC01', 'Fall', 2026, 'IP'),
('S1007', 'CS101', 'SEC02', 'Fall', 2026, 'IP'),
('S1009', 'EE201', 'SEC01', 'Fall', 2026, 'IP'),
('S1010', 'EE201', 'SEC01', 'Fall', 2026, 'IP'),
('S1015', 'ME101', 'SEC01', 'Fall', 2026, 'IP'),
('S1016', 'ME101', 'SEC01', 'Fall', 2026, 'IP'),
('S1021', 'MA101', 'SEC01', 'Fall', 2026, 'IP'),
('S1026', 'MG101', 'SEC01', 'Fall', 2026, 'IP');
