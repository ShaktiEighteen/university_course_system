from django.db import transaction
from django.db.models import Sum
from django.conf import settings
from apps.core.models import Student, Classroom, TimeSlot, Instructor
from apps.courses.models import Course, Section, Prereq, Teaches
from apps.registration.models import Takes

class RegistrationError(Exception):
    """Custom exception raised when registration business rule is violated."""
    pass


def register_student_for_section(student: Student, section_id: int) -> Takes:
    """
    ACID transactional registration with strict business rule validation:
    1. Row-level lock on Section
    2. Duplicate registration check
    3. Prerequisite completion check
    4. Semester credit limit check
    5. Time slot conflict check
    6. Section seat capacity check
    """
    with transaction.atomic():
        try:
            section = (
                Section.objects
                .select_for_update()
                .select_related('course', 'time_slot', 'classroom')
                .get(id=section_id)
            )
        except Section.DoesNotExist:
            raise RegistrationError("The requested course section does not exist.")

        # 1. Check duplicate registration in the same semester & year
        if Takes.objects.filter(
            student=student,
            course=section.course,
            semester=section.semester,
            year=section.year
        ).exists():
            raise RegistrationError(
                f"You are already registered for course {section.course.course_id} in {section.semester} {section.year}."
            )

        # 2. Check Prerequisites
        prereqs = Prereq.objects.filter(course=section.course).select_related('prereq_course')
        for p in prereqs:
            passed = Takes.objects.filter(
                student=student,
                course=p.prereq_course,
                grade__in=Takes.PASSING_GRADES
            ).exists()
            if not passed:
                raise RegistrationError(
                    f"Prerequisite not satisfied: Must complete {p.prereq_course.course_id} ({p.prereq_course.title}) with a passing grade first."
                )

        # 3. Check Semester Credit Limit
        max_allowed_credits = getattr(settings, 'MAX_CREDITS_PER_SEMESTER', 18)
        current_credits = (
            Takes.objects.filter(
                student=student,
                semester=section.semester,
                year=section.year
            ).aggregate(total=Sum('course__credits'))['total'] or 0
        )
        if current_credits + section.course.credits > max_allowed_credits:
            raise RegistrationError(
                f"Semester credit limit exceeded: Currently enrolled in {current_credits} credits. Adding {section.course.credits} credits exceeds maximum allowed limit of {max_allowed_credits} credits."
            )

        # 4. Check Time-Slot Clashes
        enrolled_sections = (
            Takes.objects.filter(
                student=student,
                semester=section.semester,
                year=section.year
            ).select_related('section__time_slot', 'course')
        )
        for enrollment in enrolled_sections:
            existing_ts = enrollment.section.time_slot
            if existing_ts.overlaps_with(section.time_slot):
                raise RegistrationError(
                    f"Schedule clash: Conflicts with {enrollment.course.course_id} on {existing_ts.day} ({existing_ts.start_time.strftime('%H:%M')}-{existing_ts.end_time.strftime('%H:%M')})."
                )

        # 5. Check Capacity Limits
        enrolled_count = Takes.objects.filter(section=section).count()
        if enrolled_count >= section.capacity:
            raise RegistrationError(
                f"Section {section.course.course_id}-{section.section_id} is full ({enrolled_count}/{section.capacity} seats taken)."
            )

        # 6. Execute Registration Record
        record = Takes.objects.create(
            student=student,
            section=section,
            course=section.course,
            semester=section.semester,
            year=section.year,
            grade='IP'
        )
        return record


def drop_student_from_section(student: Student, section_id: int):
    """
    ACID transactional course drop.
    """
    with transaction.atomic():
        try:
            takes_record = (
                Takes.objects
                .select_for_update()
                .get(student=student, section_id=section_id)
            )
        except Takes.DoesNotExist:
            raise RegistrationError("You are not currently enrolled in this section.")

        takes_record.delete()
        return True


def validate_scheduling_conflict(classroom: Classroom, time_slot: TimeSlot, semester: str, year: int, instructor: Instructor = None, exclude_section_id: int = None):
    """
    Validates that:
    1. Classroom is not double-booked for the same time slot in the semester
    2. Instructor is not double-booked for the same time slot in the semester
    """
    room_conflicts = Section.objects.filter(
        classroom=classroom,
        time_slot=time_slot,
        semester=semester,
        year=year
    )
    if exclude_section_id:
        room_conflicts = room_conflicts.exclude(id=exclude_section_id)

    if room_conflicts.exists():
        conflicting = room_conflicts.first()
        raise RegistrationError(
            f"Classroom conflict: {classroom} is already occupied by {conflicting.course.course_id}-{conflicting.section_id} during {time_slot}."
        )

    if instructor:
        inst_conflicts = Teaches.objects.filter(
            instructor=instructor,
            semester=semester,
            year=year,
            section__time_slot=time_slot
        )
        if exclude_section_id:
            inst_conflicts = inst_conflicts.exclude(section_id=exclude_section_id)

        if inst_conflicts.exists():
            conflicting = inst_conflicts.first()
            raise RegistrationError(
                f"Instructor conflict: {instructor.name} is already assigned to {conflicting.course.course_id}-{conflicting.section.section_id} during {time_slot}."
            )
