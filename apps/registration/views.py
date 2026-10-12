import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from apps.core.models import Student, Instructor
from apps.courses.models import Section, Teaches
from apps.registration.models import Takes
from apps.core.auth import get_current_user, role_required
from apps.registration.services import register_student_for_section, drop_student_from_section, RegistrationError
from django.views.decorators.csrf import csrf_exempt

GRADE_POINTS = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D': 1.0,  'F': 0.0
}

@csrf_exempt
@role_required(['student'])
@require_http_methods(['POST'])
def api_register_course(request):
    """
    Student course registration API endpoint.
    Invokes ACID transactional business logic engine.
    """
    try:
        data = json.loads(request.body)
        section_id = int(data.get('section_id'))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({'success': False, 'error': 'Invalid section ID.'}, status=400)

    try:
        record = register_student_for_section(request.student, section_id)
        return JsonResponse({
            'success': True,
            'message': f"Successfully enrolled in {record.course.course_id} ({record.section.section_id})!",
            'course_id': record.course.course_id,
            'title': record.course.title,
            'credits': record.course.credits,
            'section_id': record.section.section_id
        })
    except RegistrationError as err:
        return JsonResponse({'success': False, 'error': str(err)}, status=400)
    except Exception as exc:
        return JsonResponse({'success': False, 'error': f"Unexpected error during registration: {str(exc)}"}, status=500)


@csrf_exempt
@role_required(['student'])
@require_http_methods(['POST'])
def api_drop_course(request):
    """
    Student course drop API endpoint.
    """
    try:
        data = json.loads(request.body)
        section_id = int(data.get('section_id'))
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({'success': False, 'error': 'Invalid section ID.'}, status=400)

    try:
        drop_student_from_section(request.student, section_id)
        return JsonResponse({'success': True, 'message': 'Course dropped successfully.'})
    except RegistrationError as err:
        return JsonResponse({'success': False, 'error': str(err)}, status=400)
    except Exception as exc:
        return JsonResponse({'success': False, 'error': f"Failed to drop course: {str(exc)}"}, status=500)


@role_required(['student'])
@require_http_methods(['GET'])
def api_student_timetable(request):
    """
    Returns student's active schedule for the semester, 
    with total registered credits and day-wise ordering.
    """
    semester = request.GET.get('semester', getattr(settings, 'DEFAULT_SEMESTER', 'Fall'))
    year = int(request.GET.get('year', getattr(settings, 'DEFAULT_YEAR', 2026)))

    enrollments = (
        Takes.objects
        .filter(student=request.student, semester=semester, year=year)
        .select_related('course', 'section__classroom', 'section__time_slot')
        .prefetch_related('section__teaches_set__instructor')
        .order_by('section__time_slot__day', 'section__time_slot__start_time')
    )

    items = []
    total_credits = 0

    for enr in enrollments:
        sec = enr.section
        ts = sec.time_slot
        cr = sec.classroom
        instructors = [t.instructor.name for t in sec.teaches_set.all()]
        inst_name = ", ".join(instructors) if instructors else "TBA"

        total_credits += enr.course.credits

        items.append({
            'takes_id': enr.id,
            'section_id': sec.id,
            'sec_code': sec.section_id,
            'course_id': enr.course.course_id,
            'title': enr.course.title,
            'credits': enr.course.credits,
            'day': ts.day,
            'start_time': ts.start_time.strftime('%H:%M'),
            'end_time': ts.end_time.strftime('%H:%M'),
            'time_slot': f"{ts.day} {ts.start_time.strftime('%H:%M')}-{ts.end_time.strftime('%H:%M')}",
            'classroom': f"{cr.building} {cr.room_number}",
            'instructor': inst_name,
            'grade': enr.grade
        })

    max_credits = getattr(settings, 'MAX_CREDITS_PER_SEMESTER', 18)

    return JsonResponse({
        'success': True,
        'semester': semester,
        'year': year,
        'total_credits': total_credits,
        'max_credits': max_credits,
        'schedule': items
    })


@role_required(['student'])
@require_http_methods(['GET'])
def api_student_grades(request):
    """
    Returns full academic history and GPA calculation for the logged-in student.
    """
    records = (
        Takes.objects
        .filter(student=request.student)
        .select_related('course', 'section')
        .order_by('-year', '-semester', 'course__course_id')
    )

    history = []
    quality_points = 0.0
    gpa_credits = 0
    earned_credits = 0

    for r in records:
        grade = r.grade or 'IP'
        points = GRADE_POINTS.get(grade, None)

        if grade in Takes.PASSING_GRADES:
            earned_credits += r.course.credits

        if points is not None:
            quality_points += points * r.course.credits
            gpa_credits += r.course.credits

        history.append({
            'course_id': r.course.course_id,
            'title': r.course.title,
            'credits': r.course.credits,
            'semester': r.semester,
            'year': r.year,
            'grade': grade,
            'grade_point': points
        })

    cgpa = round(quality_points / gpa_credits, 2) if gpa_credits > 0 else 0.0

    return JsonResponse({
        'success': True,
        'cgpa': cgpa,
        'total_earned_credits': earned_credits,
        'records': history
    })


# ==============================================================
# INSTRUCTOR APIs
# ==============================================================

@role_required(['instructor'])
@require_http_methods(['GET'])
def api_instructor_sections(request):
    """
    Returns sections assigned to the logged-in instructor.
    """
    semester = request.GET.get('semester', getattr(settings, 'DEFAULT_SEMESTER', 'Fall'))
    year = int(request.GET.get('year', getattr(settings, 'DEFAULT_YEAR', 2026)))

    assignments = (
        Teaches.objects
        .filter(instructor=request.instructor, semester=semester, year=year)
        .select_related('section__course', 'section__classroom', 'section__time_slot')
        .prefetch_related('section__takes_set')
    )

    sections_data = []
    for a in assignments:
        sec = a.section
        enrolled_count = sec.takes_set.count()
        sections_data.append({
            'section_pk': sec.id,
            'course_id': sec.course.course_id,
            'title': sec.course.title,
            'section_id': sec.section_id,
            'credits': sec.course.credits,
            'semester': sec.semester,
            'year': sec.year,
            'classroom': f"{sec.classroom.building} {sec.classroom.room_number}",
            'time_slot': f"{sec.time_slot.day} {sec.time_slot.start_time.strftime('%H:%M')}-{sec.time_slot.end_time.strftime('%H:%M')}",
            'capacity': sec.capacity,
            'enrolled_count': enrolled_count,
            'available_seats': max(0, sec.capacity - enrolled_count)
        })

    return JsonResponse({'success': True, 'sections': sections_data})


@role_required(['instructor'])
@require_http_methods(['GET'])
def api_instructor_roster(request, section_id):
    """
    Returns enrolled students roster for an assigned section.
    """
    # Ensure current instructor teaches this section
    is_authorized = Teaches.objects.filter(instructor=request.instructor, section_id=section_id).exists()
    if not is_authorized:
        return JsonResponse({'success': False, 'error': 'You are not assigned to teach this section.'}, status=403)

    try:
        section = Section.objects.select_related('course').get(id=section_id)
    except Section.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Section not found.'}, status=404)

    roster = (
        Takes.objects
        .filter(section=section)
        .select_related('student__department')
        .order_by('student__student_id')
    )

    students_list = []
    for enr in roster:
        students_list.append({
            'takes_id': enr.id,
            'student_id': enr.student.student_id,
            'name': enr.student.name,
            'dept_name': enr.student.department.dept_name,
            'grade': enr.grade or 'IP',
            'registered_at': enr.registered_at.strftime('%Y-%m-%d %H:%M')
        })

    return JsonResponse({
        'success': True,
        'course_id': section.course.course_id,
        'title': section.course.title,
        'section_id': section.section_id,
        'students': students_list
    })


@csrf_exempt
@role_required(['instructor'])
@require_http_methods(['POST'])
def api_instructor_update_grade(request):
    """
    Updates student grade for an assigned section.
    """
    data = json.loads(request.body)
    section_id = int(data.get('section_id'))
    student_id = data.get('student_id', '').strip()
    new_grade = data.get('grade', '').strip().upper()

    valid_grades = [choice[0] for choice in Takes.GRADE_CHOICES]
    if new_grade not in valid_grades:
        return JsonResponse({'success': False, 'error': f"Invalid grade. Allowed grades: {', '.join(valid_grades)}"}, status=400)

    # Check instructor authorization
    if not Teaches.objects.filter(instructor=request.instructor, section_id=section_id).exists():
        return JsonResponse({'success': False, 'error': 'Unauthorized to modify grades for this section.'}, status=403)

    try:
        takes = Takes.objects.select_related('student', 'course').get(section_id=section_id, student__student_id=student_id)
        takes.grade = new_grade
        takes.save()

        # Recalculate student tot_cred based on all passed courses
        passed_credits = (
            Takes.objects
            .filter(student=takes.student, grade__in=Takes.PASSING_GRADES)
            .values('course').distinct()
            .count()
        )
        total_cr = sum(
            t.course.credits for t in
            Takes.objects.filter(student=takes.student, grade__in=Takes.PASSING_GRADES).select_related('course')
        )
        takes.student.tot_cred = total_cr
        takes.student.save(update_fields=['tot_cred'])

        return JsonResponse({'success': True, 'message': f"Grade for {student_id} updated to {new_grade}."})
    except Takes.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Student enrollment not found in this section.'}, status=404)
