from django.urls import path
from apps.courses import views

urlpatterns = [
    path('api/courses/catalog/', views.api_course_catalog, name='api_course_catalog'),
    path('api/admin/overview/', views.api_admin_overview, name='api_admin_overview'),
    path('api/admin/departments/', views.api_admin_departments, name='api_admin_departments'),
    path('api/admin/departments/<str:dept_name>/', views.api_admin_department_detail, name='api_admin_department_detail'),
    path('api/admin/courses/', views.api_admin_courses, name='api_admin_courses'),
    path('api/admin/courses/<str:course_id>/', views.api_admin_course_detail, name='api_admin_course_detail'),
    path('api/admin/sections/', views.api_admin_sections, name='api_admin_sections'),
    path('api/admin/sections/<int:section_id>/', views.api_admin_section_detail, name='api_admin_section_detail'),
    path('api/admin/students/', views.api_admin_students, name='api_admin_students'),
    path('api/admin/instructors/', views.api_admin_instructors, name='api_admin_instructors'),
    path('api/admin/helpers/', views.api_admin_helpers, name='api_admin_helpers'),
]
