import datetime
from django.test import TestCase
from django.db import IntegrityError
from apps.core.models import Department, UserAccount, Student, Instructor, Classroom, TimeSlot
from apps.courses.models import Course, Prereq, Section, Teaches
from apps.registration.models import Takes
from apps.registration.services import (
    register_student_for_section, 
    drop_student_from_section, 
    validate_scheduling_conflict, 
    RegistrationError
)

class RegistrationBusinessRulesTestCase(TestCase):
    def setUp(self):
        # 1. Department
        self.dept = Department.objects.create(dept_name='Computer Science', building='Turing Hall', budget=1000000)

        # 2. Classroom & TimeSlots
        self.room1 = Classroom.objects.create(building='Turing Hall', room_number='101', capacity=30)
        self.room_small = Classroom.objects.create(building='Turing Hall', room_number='102', capacity=1)

        self.ts_mon_morning = TimeSlot.objects.create(
            time_slot_id='TS-M1', day='Monday',
            start_time=datetime.time(9, 0), end_time=datetime.time(10, 30)
        )
        self.ts_mon_clash = TimeSlot.objects.create(
            time_slot_id='TS-M1-CLASH', day='Monday',
            start_time=datetime.time(9, 30), end_time=datetime.time(11, 0)
        )
        self.ts_tue_morning = TimeSlot.objects.create(
            time_slot_id='TS-T1', day='Tuesday',
            start_time=datetime.time(9, 0), end_time=datetime.time(10, 30)
        )

        # 3. Courses
        self.course_intro = Course.objects.create(course_id='CS101', title='Intro to CS', department=self.dept, credits=4)
        self.course_ds = Course.objects.create(course_id='CS201', title='Data Structures', department=self.dept, credits=4)
        self.course_algo = Course.objects.create(course_id='CS301', title='Algorithms', department=self.dept, credits=4)
        self.course_heavy1 = Course.objects.create(course_id='CS801', title='Heavy 1', department=self.dept, credits=8)
        self.course_heavy2 = Course.objects.create(course_id='CS802', title='Heavy 2', department=self.dept, credits=8)

        # Prerequisite: CS201 requires CS101, CS301 requires CS201
        Prereq.objects.create(course=self.course_ds, prereq_course=self.course_intro)
        Prereq.objects.create(course=self.course_algo, prereq_course=self.course_ds)

        # 4. Student 1 (New, no courses completed)
        self.user1 = UserAccount.objects.create(
            user_id='USR-S1', username='student1', password_hash='hash', role='student', email='s1@univ.edu'
        )
        self.student1 = Student.objects.create(student_id='S1', name='John Doe', department=self.dept, user=self.user1)

        # Student 2 (Has passed CS101)
        self.user2 = UserAccount.objects.create(
            user_id='USR-S2', username='student2', password_hash='hash', role='student', email='s2@univ.edu'
        )
        self.student2 = Student.objects.create(student_id='S2', name='Jane Smith', department=self.dept, user=self.user2)

        # 5. Instructor
        self.user_inst = UserAccount.objects.create(
            user_id='USR-I1', username='inst1', password_hash='hash', role='instructor', email='i1@univ.edu'
        )
        self.instructor = Instructor.objects.create(
            instructor_id='I1', name='Dr. Turing', department=self.dept, salary=90000, user=self.user_inst
        )

        # 6. Sections
        self.sec_intro = Section.objects.create(
            course=self.course_intro, section_id='SEC01', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_mon_morning, capacity=30
        )
        self.sec_ds = Section.objects.create(
            course=self.course_ds, section_id='SEC01', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_tue_morning, capacity=30
        )
        self.sec_clashing = Section.objects.create(
            course=self.course_algo, section_id='SEC01', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_mon_clash, capacity=30
        )
        self.sec_limited = Section.objects.create(
            course=self.course_intro, section_id='SEC99', semester='Fall', year=2026,
            classroom=self.room_small, time_slot=self.ts_tue_morning, capacity=1
        )

    def test_successful_registration(self):
        """Test that a valid student can register for an introductory course."""
        record = register_student_for_section(self.student1, self.sec_intro.id)
        self.assertIsNotNone(record.id)
        self.assertEqual(record.student, self.student1)
        self.assertEqual(record.section, self.sec_intro)
        self.assertEqual(record.grade, 'IP')

    def test_prerequisite_enforcement(self):
        """Test that registration is blocked if prerequisite course is not completed."""
        # student1 has not completed CS101, so registering for CS201 must fail
        with self.assertRaises(RegistrationError) as ctx:
            register_student_for_section(self.student1, self.sec_ds.id)
        self.assertIn("Prerequisite not satisfied", str(ctx.exception))
        self.assertIn("CS101", str(ctx.exception))

        # Give student2 a passing grade in CS101
        Takes.objects.create(
            student=self.student2,
            section=self.sec_intro,
            course=self.course_intro,
            semester='Spring',
            year=2026,
            grade='A'
        )
        # Now student2 should be able to register for CS201
        record = register_student_for_section(self.student2, self.sec_ds.id)
        self.assertEqual(record.course.course_id, 'CS201')

    def test_time_slot_clash_enforcement(self):
        """Test that registering for overlapping time slots in the same semester is blocked."""
        # Create another course without prerequisites
        course_intro2 = Course.objects.create(course_id='CS102', title='Discrete Structures', department=self.dept, credits=3)
        sec_clashing = Section.objects.create(
            course=course_intro2, section_id='SEC01', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_mon_clash, capacity=30
        )

        # Register student1 for Monday 09:00-10:30
        register_student_for_section(self.student1, self.sec_intro.id)

        # Attempt to register for section with time slot Monday 09:30-11:00 (overlapping!)
        with self.assertRaises(RegistrationError) as ctx:
            register_student_for_section(self.student1, sec_clashing.id)
        self.assertIn("Schedule clash", str(ctx.exception))

    def test_capacity_limit_enforcement(self):
        """Test that registration is blocked when section capacity is reached."""
        # Section capacity is 1
        # Register student 1
        register_student_for_section(self.student1, self.sec_limited.id)

        # Attempt to register student 2 in the same full section
        with self.assertRaises(RegistrationError) as ctx:
            register_student_for_section(self.student2, self.sec_limited.id)
        self.assertIn("is full", str(ctx.exception))

    def test_credit_limit_enforcement(self):
        """Test that student cannot exceed maximum credit limit (18 credits) per semester."""
        sec_h1 = Section.objects.create(
            course=self.course_heavy1, section_id='H1', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_mon_morning, capacity=30
        )
        sec_h2 = Section.objects.create(
            course=self.course_heavy2, section_id='H2', semester='Fall', year=2026,
            classroom=self.room1, time_slot=self.ts_tue_morning, capacity=30
        )
        # Register 8 + 8 = 16 credits
        register_student_for_section(self.student1, sec_h1.id)
        register_student_for_section(self.student1, sec_h2.id)

        # Try to register 4 more credits (16 + 4 = 20 > 18 limit)
        ts_wed = TimeSlot.objects.create(
            time_slot_id='TS-W1', day='Wednesday',
            start_time=datetime.time(9, 0), end_time=datetime.time(10, 30)
        )
        sec_extra = Section.objects.create(
            course=self.course_intro, section_id='SEC03', semester='Fall', year=2026,
            classroom=self.room1, time_slot=ts_wed, capacity=30
        )
        with self.assertRaises(RegistrationError) as ctx:
            register_student_for_section(self.student1, sec_extra.id)
        self.assertIn("Semester credit limit exceeded", str(ctx.exception))

    def test_duplicate_registration_enforcement(self):
        """Test that registering twice for the same course in the same semester is blocked."""
        register_student_for_section(self.student1, self.sec_intro.id)
        with self.assertRaises(RegistrationError) as ctx:
            register_student_for_section(self.student1, self.sec_intro.id)
        self.assertIn("already registered", str(ctx.exception).lower())

    def test_classroom_double_booking_prevention(self):
        """Test that scheduling two sections in the same room at the same time is prevented."""
        # sec_intro is in room1 at ts_mon_morning
        with self.assertRaises(RegistrationError) as ctx:
            validate_scheduling_conflict(
                classroom=self.room1,
                time_slot=self.ts_mon_morning,
                semester='Fall',
                year=2026
            )
        self.assertIn("Classroom conflict", str(ctx.exception))

    def test_instructor_double_booking_prevention(self):
        """Test that assigning an instructor to two sections at the same time is prevented."""
        Teaches.objects.create(
            instructor=self.instructor,
            section=self.sec_intro,
            course=self.course_intro,
            semester='Fall',
            year=2026
        )
        with self.assertRaises(RegistrationError) as ctx:
            validate_scheduling_conflict(
                classroom=self.room_small,
                time_slot=self.ts_mon_morning,
                semester='Fall',
                year=2026,
                instructor=self.instructor
            )
        self.assertIn("Instructor conflict", str(ctx.exception))

    def test_drop_course(self):
        """Test that dropping an enrolled section succeeds and frees up the seat."""
        register_student_for_section(self.student1, self.sec_limited.id)
        self.assertEqual(self.sec_limited.takes_set.count(), 1)

        # Drop course
        res = drop_student_from_section(self.student1, self.sec_limited.id)
        self.assertTrue(res)
        self.assertEqual(self.sec_limited.takes_set.count(), 0)

        # Now student2 can register into that freed seat
        record = register_student_for_section(self.student2, self.sec_limited.id)
        self.assertIsNotNone(record)
