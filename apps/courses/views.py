import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.db.models import Q, Count
from django.conf import settings
from apps.core.models import Department, Student, Instructor, Classroom, TimeSlot, UserAccount
from apps.courses.models import Course, Prereq, Section, Teaches
from apps.registration.models import Takes
from apps.core.auth import get_current_user, role_required
from apps.registration.services import validate_scheduling_conflict, RegistrationError
from django.views.decorators.csrf import csrf_exempt

@require_http_methods(['GET'])
def api_course_catalog(request):
    """
    Returns available sections for registration with live seat counts, 
    prerequisite requirements, instructor info, and conflict indicators.
    Avoids N+1 queries using select_related and prefetch_related.
    """
    user = get_current_user(request)
    student = None
    if user and user.role == 'student':
        student = Student.objects.filter(user=user).first()

    dept = request.GET.get('dept', '').strip()
    search = request.GET.get('search', '').strip()
    credits_filter = request.GET.get('credits', '').strip()
    semester = request.GET.get('semester', getattr(settings, 'DEFAULT_SEMESTER', 'Fall'))
    year = request.GET.get('year', getattr(settings, 'DEFAULT_YEAR', 2026))

    queryset = (
        Section.objects
        .filter(semester=semester, year=year)
        .select_related('course', 'course__department', 'classroom', 'time_slot')
        .prefetch_related(
            'teaches_set__instructor',
            'course__prerequisites__prereq_course',
            'takes_set'
        )
        .order_by('course__course_id', 'section_id')
    )

    if dept:
        queryset = queryset.filter(course__department__dept_name=dept)
    if credits_filter:
        try:
            queryset = queryset.filter(course__credits=int(credits_filter))
        except ValueError:
            pass
    if search:
        queryset = queryset.filter(
            Q(course__course_id__icontains=search) |
            Q(course__title__icontains=search) |
            Q(teaches__instructor__name__icontains=search)
        ).distinct()

    # If student is logged in, pre-fetch student's enrolled courses and completed courses
    enrolled_section_ids = set()
    enrolled_course_ids = set()
    student_takes_this_term = []
    completed_prereqs = set()

    if student:
        active_takes = Takes.objects.filter(student=student, semester=semester, year=year).select_related('section__time_slot')
        for t in active_takes:
            enrolled_section_ids.add(t.section_id)
            enrolled_course_ids.add(t.course_id)
            student_takes_this_term.append(t)

        past_takes = Takes.objects.filter(student=student, grade__in=Takes.PASSING_GRADES).values_list('course_id', flat=True)
        completed_prereqs = set(past_takes)

    # Paginate results
    page_number = request.GET.get('page', 1)
    paginator = Paginator(queryset, 12)
    page_obj = paginator.get_page(page_number)

    results = []
    for sec in page_obj:
        # Instructor(s)
        instructors = [t.instructor.name for t in sec.teaches_set.all()]
        inst_name = ", ".join(instructors) if instructors else "TBA"

        # Prerequisites
        prereq_list = [p.prereq_course.course_id for p in sec.course.prerequisites.all()]
        prereqs_met = True
        missing_prereqs = []
        for p_code in prereq_list:
            if p_code not in completed_prereqs:
                prereqs_met = False
                missing_prereqs.append(p_code)

        # Enrolled count and live seats
        enrolled = sec.takes_set.count()
        avail = max(0, sec.capacity - enrolled)

        # Schedule clash
        has_clash = False
        clash_reason = ""
        if student:
            for enr in student_takes_this_term:
                if enr.section_id != sec.id and enr.section.time_slot.overlaps_with(sec.time_slot):
                    has_clash = True
                    clash_reason = f"Conflicts with {enr.course_id} on {sec.time_slot.day} ({sec.time_slot.start_time.strftime('%H:%M')})"
                    break

        results.append({
            'id': sec.id,
            'course_id': sec.course.course_id,
            'title': sec.course.title,
            'dept_name': sec.course.department.dept_name,
            'credits': sec.course.credits,
            'section_id': sec.section_id,
            'semester': sec.semester,
            'year': sec.year,
            'classroom': f"{sec.classroom.building} {sec.classroom.room_number}",
            'classroom_id': sec.classroom.id,
            'time_slot': f"{sec.time_slot.day} {sec.time_slot.start_time.strftime('%H:%M')}-{sec.time_slot.end_time.strftime('%H:%M')}",
            'time_slot_id': sec.time_slot.time_slot_id,
            'instructor': inst_name,
            'capacity': sec.capacity,
            'enrolled_count': enrolled,
            'available_seats': avail,
            'is_full': avail == 0,
            'prerequisites': prereq_list,
            'prereqs_met': prereqs_met,
            'missing_prereqs': missing_prereqs,
            'is_registered': sec.id in enrolled_section_ids or sec.course.course_id in enrolled_course_ids,
            'has_clash': has_clash,
            'clash_reason': clash_reason,
        })

    return JsonResponse({
        'success': True,
        'sections': results,
        'total': paginator.count,
        'num_pages': paginator.num_pages,
        'current_page': page_obj.number,
        'has_next': page_obj.has_next(),
        'has_previous': page_obj.has_previous(),
    })


# ==============================================================
# ADMIN CRUD APIs
# ==============================================================

@role_required(['admin'])
@require_http_methods(['GET'])
def api_admin_overview(request):
    """System analytics and count metrics for admin dashboard."""
    semester = getattr(settings, 'DEFAULT_SEMESTER', 'Fall')
    year = getattr(settings, 'DEFAULT_YEAR', 2026)

    stats = {
        'total_students': Student.objects.count(),
        'total_instructors': Instructor.objects.count(),
        'total_departments': Department.objects.count(),
        'total_courses': Course.objects.count(),
        'total_sections': Section.objects.filter(semester=semester, year=year).count(),
        'total_enrollments': Takes.objects.filter(semester=semester, year=year).count(),
    }
    return JsonResponse({'success': True, 'stats': stats})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['GET', 'POST'])
def api_admin_departments(request):
    if request.method == 'GET':
        depts = list(Department.objects.values('dept_name', 'building', 'budget'))
        return JsonResponse({'success': True, 'departments': depts})

    # POST (Create)
    data = json.loads(request.body)
    dept_name = data.get('dept_name', '').strip()
    building = data.get('building', '').strip()
    budget = data.get('budget', 0)

    if not dept_name or not building:
        return JsonResponse({'success': False, 'error': 'Department name and building are required.'}, status=400)

    if Department.objects.filter(dept_name=dept_name).exists():
        return JsonResponse({'success': False, 'error': f"Department '{dept_name}' already exists."}, status=400)

    dept = Department.objects.create(dept_name=dept_name, building=building, budget=budget)
    return JsonResponse({'success': True, 'dept_name': dept.dept_name})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['DELETE', 'PUT'])
def api_admin_department_detail(request, dept_name):
    try:
        dept = Department.objects.get(dept_name=dept_name)
    except Department.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Department not found.'}, status=404)

    if request.method == 'DELETE':
        try:
            dept.delete()
            return JsonResponse({'success': True, 'message': 'Department deleted successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f"Cannot delete department: {str(e)}"}, status=400)

    if request.method == 'PUT':
        data = json.loads(request.body)
        dept.building = data.get('building', dept.building).strip()
        dept.budget = data.get('budget', dept.budget)
        dept.save()
        return JsonResponse({'success': True, 'message': 'Department updated successfully.'})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['GET', 'POST'])
def api_admin_courses(request):
    if request.method == 'GET':
        courses = Course.objects.select_related('department').prefetch_related('prerequisites__prereq_course').all()
        results = []
        for c in courses:
            prereqs = [p.prereq_course.course_id for p in c.prerequisites.all()]
            results.append({
                'course_id': c.course_id,
                'title': c.title,
                'dept_name': c.department.dept_name,
                'credits': c.credits,
                'prerequisites': prereqs
            })
        return JsonResponse({'success': True, 'courses': results})

    # POST (Create)
    data = json.loads(request.body)
    course_id = data.get('course_id', '').strip().upper()
    title = data.get('title', '').strip()
    dept_name = data.get('dept_name', '').strip()
    credits = int(data.get('credits', 3))
    prereq_ids = data.get('prerequisites', [])

    if not course_id or not title or not dept_name:
        return JsonResponse({'success': False, 'error': 'Course ID, title, and department are required.'}, status=400)

    if Course.objects.filter(course_id=course_id).exists():
        return JsonResponse({'success': False, 'error': f"Course '{course_id}' already exists."}, status=400)

    try:
        dept = Department.objects.get(dept_name=dept_name)
    except Department.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invalid department specified.'}, status=400)

    course = Course.objects.create(course_id=course_id, title=title, department=dept, credits=credits)

    for pid in prereq_ids:
        if pid != course_id and Course.objects.filter(course_id=pid).exists():
            Prereq.objects.create(course=course, prereq_course_id=pid)

    return JsonResponse({'success': True, 'course_id': course.course_id})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['DELETE', 'PUT'])
def api_admin_course_detail(request, course_id):
    try:
        course = Course.objects.get(course_id=course_id)
    except Course.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Course not found.'}, status=404)

    if request.method == 'DELETE':
        try:
            course.delete()
            return JsonResponse({'success': True, 'message': 'Course deleted successfully.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': f"Cannot delete course: {str(e)}"}, status=400)

    if request.method == 'PUT':
        data = json.loads(request.body)
        course.title = data.get('title', course.title).strip()
        course.credits = int(data.get('credits', course.credits))
        course.save()

        # Update prerequisites if provided
        if 'prerequisites' in data:
            Prereq.objects.filter(course=course).delete()
            for pid in data['prerequisites']:
                if pid != course_id and Course.objects.filter(course_id=pid).exists():
                    Prereq.objects.create(course=course, prereq_course_id=pid)

        return JsonResponse({'success': True, 'message': 'Course updated successfully.'})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['GET', 'POST'])
def api_admin_sections(request):
    semester = request.GET.get('semester', getattr(settings, 'DEFAULT_SEMESTER', 'Fall'))
    year = int(request.GET.get('year', getattr(settings, 'DEFAULT_YEAR', 2026)))

    if request.method == 'GET':
        sections = (
            Section.objects
            .filter(semester=semester, year=year)
            .select_related('course', 'classroom', 'time_slot')
            .prefetch_related('teaches_set__instructor', 'takes_set')
        )
        results = []
        for s in sections:
            inst = [t.instructor.name for t in s.teaches_set.all()]
            results.append({
                'id': s.id,
                'course_id': s.course_id,
                'course_title': s.course.title,
                'section_id': s.section_id,
                'semester': s.semester,
                'year': s.year,
                'classroom': f"{s.classroom.building} {s.classroom.room_number}",
                'classroom_id': s.classroom.id,
                'time_slot': f"{s.time_slot.day} {s.time_slot.start_time.strftime('%H:%M')}-{s.time_slot.end_time.strftime('%H:%M')}",
                'time_slot_id': s.time_slot.time_slot_id,
                'capacity': s.capacity,
                'enrolled_count': s.takes_set.count(),
                'instructor': ", ".join(inst) if inst else "Unassigned",
                'instructor_id': s.teaches_set.first().instructor_id if s.teaches_set.exists() else None
            })
        return JsonResponse({'success': True, 'sections': results})

    # POST (Create Section with double-booking validation)
    data = json.loads(request.body)
    course_id = data.get('course_id')
    section_id = data.get('section_id', 'SEC01').strip().upper()
    sec_semester = data.get('semester', semester)
    sec_year = int(data.get('year', year))
    classroom_id = data.get('classroom_id')
    time_slot_id = data.get('time_slot_id')
    capacity = int(data.get('capacity', 35))
    instructor_id = data.get('instructor_id')

    try:
        course = Course.objects.get(course_id=course_id)
        classroom = Classroom.objects.get(id=classroom_id)
        time_slot = TimeSlot.objects.get(time_slot_id=time_slot_id)
        instructor = Instructor.objects.get(instructor_id=instructor_id) if instructor_id else None
    except Exception as e:
        return JsonResponse({'success': False, 'error': f"Invalid entity: {str(e)}"}, status=400)

    # Validate duplicate section
    if Section.objects.filter(course=course, section_id=section_id, semester=sec_semester, year=sec_year).exists():
        return JsonResponse({'success': False, 'error': f"Section {course_id}-{section_id} already exists for {sec_semester} {sec_year}."}, status=400)

    # Validate classroom double booking and instructor double booking
    try:
        validate_scheduling_conflict(classroom, time_slot, sec_semester, sec_year, instructor)
    except RegistrationError as err:
        return JsonResponse({'success': False, 'error': str(err)}, status=400)

    new_sec = Section.objects.create(
        course=course,
        section_id=section_id,
        semester=sec_semester,
        year=sec_year,
        classroom=classroom,
        time_slot=time_slot,
        capacity=capacity
    )
    if instructor:
        Teaches.objects.create(
            instructor=instructor,
            section=new_sec,
            course=course,
            semester=sec_semester,
            year=sec_year
        )

    return JsonResponse({'success': True, 'id': new_sec.id, 'message': 'Section created successfully.'})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['DELETE'])
def api_admin_section_detail(request, section_id):
    try:
        sec = Section.objects.get(id=section_id)
        sec.delete()
        return JsonResponse({'success': True, 'message': 'Section deleted successfully.'})
    except Section.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Section not found.'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)}, status=400)


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['GET', 'POST'])
def api_admin_students(request):
    if request.method == 'GET':
        students = Student.objects.select_related('department', 'user').all()
        results = [{
            'student_id': s.student_id,
            'name': s.name,
            'dept_name': s.department.dept_name,
            'tot_cred': s.tot_cred,
            'username': s.user.username if s.user else None,
            'email': s.user.email if s.user else None
        } for s in students]
        return JsonResponse({'success': True, 'students': results})

    # POST (Create student & login account)
    data = json.loads(request.body)
    student_id = data.get('student_id', '').strip().upper()
    name = data.get('name', '').strip()
    dept_name = data.get('dept_name', '').strip()
    username = data.get('username', '').strip().lower()
    password = data.get('password', 'pass123')
    email = data.get('email', f"{username}@univ.edu").strip()

    if not student_id or not name or not dept_name or not username:
        return JsonResponse({'success': False, 'error': 'All fields are required.'}, status=400)

    if Student.objects.filter(student_id=student_id).exists():
        return JsonResponse({'success': False, 'error': f"Student ID '{student_id}' already exists."}, status=400)

    if UserAccount.objects.filter(username=username).exists():
        return JsonResponse({'success': False, 'error': f"Username '{username}' already exists."}, status=400)

    try:
        dept = Department.objects.get(dept_name=dept_name)
    except Department.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invalid department.'}, status=400)

    user = UserAccount(
        user_id=f"USR-{student_id}",
        username=username,
        role='student',
        email=email
    )
    user.set_password(password)
    user.save()

    student = Student.objects.create(
        student_id=student_id,
        name=name,
        department=dept,
        user=user
    )

    return JsonResponse({'success': True, 'student_id': student.student_id})


@csrf_exempt
@role_required(['admin'])
@require_http_methods(['GET', 'POST'])
def api_admin_instructors(request):
    if request.method == 'GET':
        instructors = Instructor.objects.select_related('department', 'user').all()
        results = [{
            'instructor_id': i.instructor_id,
            'name': i.name,
            'dept_name': i.department.dept_name,
            'salary': str(i.salary),
            'username': i.user.username if i.user else None,
            'email': i.user.email if i.user else None
        } for i in instructors]
        return JsonResponse({'success': True, 'instructors': results})

    # POST (Create instructor & login account)
    data = json.loads(request.body)
    instructor_id = data.get('instructor_id', '').strip().upper()
    name = data.get('name', '').strip()
    dept_name = data.get('dept_name', '').strip()
    salary = data.get('salary', 85000.00)
    username = data.get('username', '').strip().lower()
    password = data.get('password', 'teach123')
    email = data.get('email', f"{username}@univ.edu").strip()

    if not instructor_id or not name or not dept_name or not username:
        return JsonResponse({'success': False, 'error': 'All fields are required.'}, status=400)

    if Instructor.objects.filter(instructor_id=instructor_id).exists():
        return JsonResponse({'success': False, 'error': f"Instructor ID '{instructor_id}' already exists."}, status=400)

    try:
        dept = Department.objects.get(dept_name=dept_name)
    except Department.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Invalid department.'}, status=400)

    user = UserAccount(
        user_id=f"USR-{instructor_id}",
        username=username,
        role='instructor',
        email=email
    )
    user.set_password(password)
    user.save()

    inst = Instructor.objects.create(
        instructor_id=instructor_id,
        name=name,
        department=dept,
        salary=salary,
        user=user
    )
    return JsonResponse({'success': True, 'instructor_id': inst.instructor_id})


@role_required(['admin'])
@require_http_methods(['GET'])
def api_admin_helpers(request):
    """Metadata helper for classrooms and timeslots."""
    classrooms = list(Classroom.objects.values('id', 'building', 'room_number', 'capacity'))
    timeslots = list(TimeSlot.objects.values('time_slot_id', 'day', 'start_time', 'end_time'))
    departments = list(Department.objects.values('dept_name'))
    courses = list(Course.objects.values('course_id', 'title'))
    instructors = list(Instructor.objects.values('instructor_id', 'name'))

    return JsonResponse({
        'success': True,
        'classrooms': classrooms,
        'timeslots': timeslots,
        'departments': departments,
        'courses': courses,
        'instructors': instructors
    })
