import json
from django.shortcuts import render, redirect
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.conf import settings
from apps.core.models import UserAccount, Student, Instructor, Department, Classroom, TimeSlot
from apps.core.auth import login_user, logout_user, get_current_user, role_required

from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie

def index_view(request):
    user = get_current_user(request)
    if user:
        return redirect('dashboard_redirect')
    return redirect('login')


@csrf_exempt
def login_view(request):
    user = get_current_user(request)
    if user:
        return redirect('dashboard_redirect')

    if request.method == 'POST':
        # Accept form-encoded or JSON payload
        if request.content_type == 'application/json':
            try:
                data = json.loads(request.body)
                username = data.get('username', '').strip()
                password = data.get('password', '')
            except Exception:
                return JsonResponse({'success': False, 'error': 'Invalid JSON format.'}, status=400)
        else:
            username = request.POST.get('username', '').strip()
            password = request.POST.get('password', '')

        try:
            account = UserAccount.objects.get(username=username, is_active=True)
            if account.check_password(password):
                login_user(request, account)
                redirect_url = '/student/dashboard/' if account.role == 'student' else (
                    '/instructor/dashboard/' if account.role == 'instructor' else '/admin-portal/'
                )
                if request.content_type == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
                    return JsonResponse({'success': True, 'redirect_url': redirect_url, 'role': account.role})
                return redirect(redirect_url)
            else:
                err_msg = 'Invalid username or password.'
        except UserAccount.DoesNotExist:
            err_msg = 'Invalid username or password.'

        if request.content_type == 'application/json' or request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': err_msg}, status=401)
        return render(request, 'login.html', {'error': err_msg})

    return render(request, 'login.html')


def logout_view(request):
    logout_user(request)
    return redirect('login')


def dashboard_redirect_view(request):
    user = get_current_user(request)
    if not user:
        return redirect('login')
    if user.role == 'student':
        return redirect('student_dashboard')
    elif user.role == 'instructor':
        return redirect('instructor_dashboard')
    elif user.role == 'admin':
        return redirect('admin_dashboard')
    return redirect('login')


@role_required(['student'])
def student_dashboard_view(request):
    departments = Department.objects.all()
    context = {
        'student': request.student,
        'user': request.user_account,
        'departments': departments,
        'current_semester': getattr(settings, 'DEFAULT_SEMESTER', 'Fall'),
        'current_year': getattr(settings, 'DEFAULT_YEAR', 2026),
    }
    return render(request, 'student_dashboard.html', context)


@role_required(['instructor'])
def instructor_dashboard_view(request):
    context = {
        'instructor': request.instructor,
        'user': request.user_account,
        'current_semester': getattr(settings, 'DEFAULT_SEMESTER', 'Fall'),
        'current_year': getattr(settings, 'DEFAULT_YEAR', 2026),
    }
    return render(request, 'instructor_dashboard.html', context)


@role_required(['admin'])
def admin_dashboard_view(request):
    context = {
        'user': request.user_account,
        'current_semester': getattr(settings, 'DEFAULT_SEMESTER', 'Fall'),
        'current_year': getattr(settings, 'DEFAULT_YEAR', 2026),
    }
    return render(request, 'admin_dashboard.html', context)


@require_http_methods(['GET'])
def api_me(request):
    user = get_current_user(request)
    if not user:
        return JsonResponse({'authenticated': False}, status=401)
    
    data = {
        'authenticated': True,
        'user_id': user.user_id,
        'username': user.username,
        'role': user.role,
        'email': user.email,
    }
    if user.role == 'student':
        student = Student.objects.filter(user=user).select_related('department').first()
        if student:
            data['student_id'] = student.student_id
            data['name'] = student.name
            data['department'] = student.department.dept_name
            data['tot_cred'] = student.tot_cred
    elif user.role == 'instructor':
        inst = Instructor.objects.filter(user=user).select_related('department').first()
        if inst:
            data['instructor_id'] = inst.instructor_id
            data['name'] = inst.name
            data['department'] = inst.department.dept_name

    return JsonResponse(data)
