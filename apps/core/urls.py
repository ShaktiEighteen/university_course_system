from django.urls import path
from apps.core import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('dashboard/', views.dashboard_redirect_view, name='dashboard_redirect'),
    path('student/dashboard/', views.student_dashboard_view, name='student_dashboard'),
    path('instructor/dashboard/', views.instructor_dashboard_view, name='instructor_dashboard'),
    path('admin-portal/', views.admin_dashboard_view, name='admin_dashboard'),
    path('api/me/', views.api_me, name='api_me'),
]
