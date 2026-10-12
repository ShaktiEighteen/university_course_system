from functools import wraps
from django.http import JsonResponse
from django.shortcuts import redirect
from apps.core.models import UserAccount, Student, Instructor

SESSION_USER_KEY = 'auth_user_id'

def login_user(request, user_account: UserAccount):
    """Store user in session."""
    request.session[SESSION_USER_KEY] = user_account.user_id
    request.session['role'] = user_account.role
    request.session['username'] = user_account.username


def logout_user(request):
    """Clear session data."""
    request.session.flush()


def get_current_user(request):
    """Retrieve logged in user from session."""
    user_id = request.session.get(SESSION_USER_KEY)
    if not user_id:
        return None
    try:
        return UserAccount.objects.get(user_id=user_id, is_active=True)
    except UserAccount.DoesNotExist:
        return None


def role_required(allowed_roles):
    """
    Decorator for views ensuring the user has one of the allowed roles.
    Works for both standard views (redirects to login) and JSON API views (returns 401/403).
    """
    def decorator(view_func):
        @wraps(view_func)
        def _wrapped_view(request, *args, **kwargs):
            user = get_current_user(request)
            is_api = request.path.startswith('/api/') or request.headers.get('x-requested-with') == 'XMLHttpRequest'

            if not user:
                if is_api:
                    return JsonResponse({'success': False, 'error': 'Authentication required. Please log in.'}, status=401)
                return redirect('login')

            if user.role not in allowed_roles:
                if is_api:
                    return JsonResponse({'success': False, 'error': f'Access forbidden: Requires role {allowed_roles}.'}, status=403)
                return redirect('dashboard_redirect')

            # Attach user and profile to request for convenience
            request.user_account = user
            if user.role == 'student':
                request.student = Student.objects.filter(user=user).select_related('department').first()
            elif user.role == 'instructor':
                request.instructor = Instructor.objects.filter(user=user).select_related('department').first()

            return view_func(request, *args, **kwargs)
        return _wrapped_view
    return decorator
