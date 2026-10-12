import datetime
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.core.models import Department, UserAccount, Student, Instructor, Classroom, TimeSlot
from apps.courses.models import Course, Prereq, Section, Teaches
from apps.registration.models import Takes

class Command(BaseCommand):
    help = 'Seeds database with realistic university course registration test data'

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding process...")

        with transaction.atomic():
            # 1. Departments
            depts_data = [
                ('Computer Science', 'Turing Hall', 1200000.00),
                ('Electrical Eng', 'Tesla Complex', 950000.00),
                ('Mechanical Eng', 'Newton Complex', 850000.00),
                ('Mathematics', 'Ramanujan Block', 600000.00),
                ('Management', 'Smith Building', 750000.00),
            ]
            depts = {}
            for name, bldg, budget in depts_data:
                dept, _ = Department.objects.get_or_create(
                    dept_name=name,
                    defaults={'building': bldg, 'budget': budget}
                )
                depts[name] = dept
            self.stdout.write(f"  [+] Seeded {len(depts)} Departments.")

            # 2. Classrooms
            rooms_data = [
                ('Turing Hall', '101', 40),
                ('Turing Hall', '201', 35),
                ('Turing Hall', '301', 60),
                ('Tesla Complex', '105', 30),
                ('Tesla Complex', '205', 45),
                ('Newton Complex', '110', 50),
                ('Ramanujan Block', '101', 40),
                ('Smith Building', '202', 45),
            ]
            rooms = {}
            for bldg, num, cap in rooms_data:
                rm, _ = Classroom.objects.get_or_create(
                    building=bldg, room_number=num,
                    defaults={'capacity': cap}
                )
                rooms[f"{bldg}-{num}"] = rm
            self.stdout.write(f"  [+] Seeded {len(rooms)} Classrooms.")

            # 3. Time Slots
            ts_data = [
                ('TS-M1', 'Monday', datetime.time(9, 0), datetime.time(10, 30)),
                ('TS-M2', 'Monday', datetime.time(11, 0), datetime.time(12, 30)),
                ('TS-M3', 'Monday', datetime.time(14, 0), datetime.time(15, 30)),
                ('TS-T1', 'Tuesday', datetime.time(9, 0), datetime.time(10, 30)),
                ('TS-T2', 'Tuesday', datetime.time(11, 0), datetime.time(12, 30)),
                ('TS-W1', 'Wednesday', datetime.time(9, 0), datetime.time(10, 30)),
                ('TS-W2', 'Wednesday', datetime.time(11, 0), datetime.time(12, 30)),
                ('TS-TH1', 'Thursday', datetime.time(9, 0), datetime.time(10, 30)),
                ('TS-TH2', 'Thursday', datetime.time(14, 0), datetime.time(15, 30)),
                ('TS-F1', 'Friday', datetime.time(10, 0), datetime.time(11, 30)),
            ]
            timeslots = {}
            for tid, day, st, et in ts_data:
                ts, _ = TimeSlot.objects.get_or_create(
                    time_slot_id=tid,
                    defaults={'day': day, 'start_time': st, 'end_time': et}
                )
                timeslots[tid] = ts
            self.stdout.write(f"  [+] Seeded {len(timeslots)} Time Slots.")

            # 4. User Accounts - Admin
            admin_user, created = UserAccount.objects.get_or_create(
                username='admin',
                defaults={
                    'user_id': 'USR-ADMIN',
                    'role': 'admin',
                    'email': 'admin@univ.edu'
                }
            )
            admin_user.set_password('admin123')
            admin_user.save()

            # 5. Instructors & User Accounts (10)
            instructors_data = [
                ('INS01', 'Dr. Alan Turing', 'Computer Science', 95000.00, 'inst_cs101', 'alan.turing@univ.edu'),
                ('INS02', 'Dr. Grace Hopper', 'Computer Science', 98000.00, 'inst_cs102', 'grace.hopper@univ.edu'),
                ('INS03', 'Dr. Nikola Tesla', 'Electrical Eng', 92000.00, 'inst_ee101', 'nikola.tesla@univ.edu'),
                ('INS04', 'Dr. Claude Shannon', 'Electrical Eng', 89000.00, 'inst_ee102', 'claude.shannon@univ.edu'),
                ('INS05', 'Dr. Isaac Newton', 'Mechanical Eng', 91000.00, 'inst_me101', 'isaac.newton@univ.edu'),
                ('INS06', 'Dr. James Watt', 'Mechanical Eng', 86000.00, 'inst_me102', 'james.watt@univ.edu'),
                ('INS07', 'Dr. Srinivasa Ramanujan', 'Mathematics', 94000.00, 'inst_ma101', 's.ramanujan@univ.edu'),
                ('INS08', 'Dr. Ada Lovelace', 'Mathematics', 92000.00, 'inst_ma102', 'ada.lovelace@univ.edu'),
                ('INS09', 'Prof. Adam Smith', 'Management', 88000.00, 'inst_mg101', 'adam.smith@univ.edu'),
                ('INS10', 'Prof. Peter Drucker', 'Management', 87000.00, 'inst_mg102', 'peter.drucker@univ.edu'),
            ]
            instructors = {}
            for iid, name, dept_name, salary, uname, email in instructors_data:
                u, _ = UserAccount.objects.get_or_create(
                    username=uname,
                    defaults={'user_id': f"USR-{iid}", 'role': 'instructor', 'email': email}
                )
                u.set_password('teach123')
                u.save()

                inst, _ = Instructor.objects.get_or_create(
                    instructor_id=iid,
                    defaults={
                        'name': name,
                        'department': depts[dept_name],
                        'salary': salary,
                        'user': u
                    }
                )
                instructors[iid] = inst
            self.stdout.write(f"  [+] Seeded {len(instructors)} Instructors with accounts.")

            # 6. Students & User Accounts (32)
            students_data = [
                ('S1001', 'Alice Johnson', 'Computer Science', 48, 'stud_cs01'),
                ('S1002', 'Bob Smith', 'Computer Science', 36, 'stud_cs02'),
                ('S1003', 'Charlie Brown', 'Computer Science', 24, 'stud_cs03'),
                ('S1004', 'David Miller', 'Computer Science', 60, 'stud_cs04'),
                ('S1005', 'Eva Green', 'Computer Science', 16, 'stud_cs05'),
                ('S1006', 'Frank Wright', 'Computer Science', 52, 'stud_cs06'),
                ('S1007', 'Grace Lee', 'Computer Science', 32, 'stud_cs07'),
                ('S1008', 'Henry Adams', 'Computer Science', 12, 'stud_cs08'),
                ('S1009', 'Ivy Chen', 'Electrical Eng', 44, 'stud_ee01'),
                ('S1010', 'Jack Davis', 'Electrical Eng', 28, 'stud_ee02'),
                ('S1011', 'Karen Wilson', 'Electrical Eng', 56, 'stud_ee03'),
                ('S1012', 'Leo Martinez', 'Electrical Eng', 20, 'stud_ee04'),
                ('S1013', 'Mona Patel', 'Electrical Eng', 36, 'stud_ee05'),
                ('S1014', 'Noah Taylor', 'Electrical Eng', 12, 'stud_ee06'),
                ('S1015', 'Olivia White', 'Mechanical Eng', 48, 'stud_me01'),
                ('S1016', 'Paul Harris', 'Mechanical Eng', 32, 'stud_me02'),
                ('S1017', 'Quinn Clark', 'Mechanical Eng', 64, 'stud_me03'),
                ('S1018', 'Rachel Lewis', 'Mechanical Eng', 16, 'stud_me04'),
                ('S1019', 'Sam Robinson', 'Mechanical Eng', 40, 'stud_me05'),
                ('S1020', 'Tara Walker', 'Mechanical Eng', 24, 'stud_me06'),
                ('S1021', 'Umar Farooq', 'Mathematics', 48, 'stud_ma01'),
                ('S1022', 'Victor Hall', 'Mathematics', 32, 'stud_ma02'),
                ('S1023', 'Wendy Allen', 'Mathematics', 60, 'stud_ma03'),
                ('S1024', 'Xavier Young', 'Mathematics', 16, 'stud_ma04'),
                ('S1025', 'Yasmin King', 'Mathematics', 40, 'stud_ma05'),
                ('S1026', 'Zack Wright', 'Management', 44, 'stud_mg01'),
                ('S1027', 'Amber Scott', 'Management', 28, 'stud_mg02'),
                ('S1028', 'Brian Green', 'Management', 52, 'stud_mg03'),
                ('S1029', 'Chloe Baker', 'Management', 16, 'stud_mg04'),
                ('S1030', 'Danielle Nelson', 'Management', 36, 'stud_mg05'),
                ('S1031', 'Eric Carter', 'Computer Science', 8, 'stud_cs09'),
                ('S1032', 'Fiona Mitchell', 'Computer Science', 8, 'stud_cs10'),
            ]
            students = {}
            for sid, name, dept_name, credits, uname in students_data:
                u, _ = UserAccount.objects.get_or_create(
                    username=uname,
                    defaults={'user_id': f"USR-{sid}", 'role': 'student', 'email': f"{uname}@univ.edu"}
                )
                u.set_password('pass123')
                u.save()

                stu, _ = Student.objects.get_or_create(
                    student_id=sid,
                    defaults={
                        'name': name,
                        'department': depts[dept_name],
                        'tot_cred': credits,
                        'user': u
                    }
                )
                students[sid] = stu
            self.stdout.write(f"  [+] Seeded {len(students)} Students with accounts.")

            # 7. Courses (17)
            courses_data = [
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
                ('MG201', 'Financial Accounting', 'Management', 3),
            ]
            courses = {}
            for cid, title, dept_name, cr in courses_data:
                c, _ = Course.objects.get_or_create(
                    course_id=cid,
                    defaults={'title': title, 'department': depts[dept_name], 'credits': cr}
                )
                courses[cid] = c
            self.stdout.write(f"  [+] Seeded {len(courses)} Courses.")

            # 8. Prerequisites
            prereqs_data = [
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
                ('MG201', 'MG101'),
            ]
            for cid, pid in prereqs_data:
                Prereq.objects.get_or_create(
                    course=courses[cid],
                    prereq_course=courses[pid]
                )
            self.stdout.write(f"  [+] Seeded {len(prereqs_data)} Course Prerequisites.")

            # 9. Sections (22)
            sections_data = [
                # Fall 2026 (Active)
                ('CS101', 'SEC01', 'Fall', 2026, 'Turing Hall-101', 'TS-M1', 40, 'INS01'),
                ('CS101', 'SEC02', 'Fall', 2026, 'Turing Hall-201', 'TS-T1', 35, 'INS02'),
                ('CS201', 'SEC01', 'Fall', 2026, 'Turing Hall-301', 'TS-M2', 40, 'INS01'),
                ('CS202', 'SEC01', 'Fall', 2026, 'Turing Hall-101', 'TS-W1', 35, 'INS02'),
                ('CS301', 'SEC01', 'Fall', 2026, 'Turing Hall-201', 'TS-TH1', 30, 'INS01'),
                ('CS302', 'SEC01', 'Fall', 2026, 'Turing Hall-301', 'TS-F1', 35, 'INS02'),
                ('CS401', 'SEC01', 'Fall', 2026, 'Turing Hall-201', 'TS-M3', 25, 'INS01'),
                ('EE101', 'SEC01', 'Fall', 2026, 'Tesla Complex-105', 'TS-M1', 30, 'INS03'),
                ('EE201', 'SEC01', 'Fall', 2026, 'Tesla Complex-205', 'TS-T2', 30, 'INS04'),
                ('EE301', 'SEC01', 'Fall', 2026, 'Tesla Complex-105', 'TS-TH2', 25, 'INS03'),
                ('ME101', 'SEC01', 'Fall', 2026, 'Newton Complex-110', 'TS-M2', 40, 'INS05'),
                ('ME201', 'SEC01', 'Fall', 2026, 'Newton Complex-110', 'TS-W2', 35, 'INS06'),
                ('ME301', 'SEC01', 'Fall', 2026, 'Newton Complex-110', 'TS-TH1', 30, 'INS05'),
                ('MA101', 'SEC01', 'Fall', 2026, 'Ramanujan Block-101', 'TS-M1', 35, 'INS07'),
                ('MA201', 'SEC01', 'Fall', 2026, 'Ramanujan Block-101', 'TS-T1', 35, 'INS08'),
                ('MA301', 'SEC01', 'Fall', 2026, 'Ramanujan Block-101', 'TS-W1', 30, 'INS07'),
                ('MG101', 'SEC01', 'Fall', 2026, 'Smith Building-202', 'TS-M3', 40, 'INS09'),
                ('MG201', 'SEC01', 'Fall', 2026, 'Smith Building-202', 'TS-TH2', 35, 'INS10'),
                # Spring 2026 (Past)
                ('CS101', 'SEC01', 'Spring', 2026, 'Turing Hall-101', 'TS-M1', 40, 'INS01'),
                ('CS201', 'SEC01', 'Spring', 2026, 'Turing Hall-301', 'TS-M2', 35, 'INS02'),
                ('MA101', 'SEC01', 'Spring', 2026, 'Ramanujan Block-101', 'TS-T1', 40, 'INS07'),
                ('EE101', 'SEC01', 'Spring', 2026, 'Tesla Complex-105', 'TS-W1', 30, 'INS03'),
            ]

            sections = {}
            for cid, sec_id, sem, yr, room_key, ts_key, cap, inst_id in sections_data:
                sec, _ = Section.objects.get_or_create(
                    course=courses[cid],
                    section_id=sec_id,
                    semester=sem,
                    year=yr,
                    defaults={
                        'classroom': rooms[room_key],
                        'time_slot': timeslots[ts_key],
                        'capacity': cap
                    }
                )
                sections[f"{cid}-{sec_id}-{sem}-{yr}"] = sec

                # Teaches
                Teaches.objects.get_or_create(
                    instructor=instructors[inst_id],
                    section=sec,
                    defaults={
                        'course': courses[cid],
                        'semester': sem,
                        'year': yr
                    }
                )
            self.stdout.write(f"  [+] Seeded {len(sections)} Sections with Instructor Assignments.")

            # 10. Completed Registrations (Spring 2026) - Prerequisites for students
            past_takes_data = [
                ('S1001', 'CS101', 'SEC01', 'Spring', 2026, 'A'),
                ('S1001', 'MA101', 'SEC01', 'Spring', 2026, 'A-'),
                ('S1002', 'CS101', 'SEC01', 'Spring', 2026, 'B+'),
                ('S1003', 'CS101', 'SEC01', 'Spring', 2026, 'B'),
                ('S1004', 'CS101', 'SEC01', 'Spring', 2026, 'A'),
                ('S1004', 'CS201', 'SEC01', 'Spring', 2026, 'A'),
                ('S1009', 'EE101', 'SEC01', 'Spring', 2026, 'A'),
                ('S1010', 'EE101', 'SEC01', 'Spring', 2026, 'B'),
            ]
            for sid, cid, sec_id, sem, yr, grade in past_takes_data:
                sec = sections[f"{cid}-{sec_id}-{sem}-{yr}"]
                Takes.objects.get_or_create(
                    student=students[sid],
                    course=courses[cid],
                    semester=sem,
                    year=yr,
                    defaults={
                        'section': sec,
                        'grade': grade
                    }
                )

            # 11. Active Registrations (Fall 2026)
            active_takes_data = [
                ('S1001', 'CS201', 'SEC01', 'Fall', 2026),
                ('S1001', 'CS202', 'SEC01', 'Fall', 2026),
                ('S1002', 'CS201', 'SEC01', 'Fall', 2026),
                ('S1003', 'CS101', 'SEC02', 'Fall', 2026),
                ('S1004', 'CS301', 'SEC01', 'Fall', 2026),
                ('S1005', 'CS101', 'SEC01', 'Fall', 2026),
                ('S1006', 'CS202', 'SEC01', 'Fall', 2026),
                ('S1007', 'CS101', 'SEC02', 'Fall', 2026),
                ('S1009', 'EE201', 'SEC01', 'Fall', 2026),
                ('S1010', 'EE201', 'SEC01', 'Fall', 2026),
                ('S1015', 'ME101', 'SEC01', 'Fall', 2026),
                ('S1016', 'ME101', 'SEC01', 'Fall', 2026),
                ('S1021', 'MA101', 'SEC01', 'Fall', 2026),
                ('S1026', 'MG101', 'SEC01', 'Fall', 2026),
            ]
            for sid, cid, sec_id, sem, yr in active_takes_data:
                sec = sections[f"{cid}-{sec_id}-{sem}-{yr}"]
                Takes.objects.get_or_create(
                    student=students[sid],
                    course=courses[cid],
                    semester=sem,
                    year=yr,
                    defaults={
                        'section': sec,
                        'grade': 'IP'
                    }
                )

            self.stdout.write(self.style.SUCCESS("Database seeding completed successfully! All entities, credentials, and constraints are ready."))
