from django.urls import path
from apps.registration import views

urlpatterns = [
    # Student registration & schedule
    path('api/registration/register/', views.api_register_course, name='api_register_course'),
    path('api/registration/drop/', views.api_drop_course, name='api_drop_course'),
    path('api/registration/timetable/', views.api_student_timetable, name='api_student_timetable'),
    path('api/registration/grades/', views.api_student_grades, name='api_student_grades'),

    # Instructor endpoints
    path('api/instructor/sections/', views.api_instructor_sections, name='api_instructor_sections'),
    path('api/instructor/roster/<int:section_id>/', views.api_instructor_roster, name='api_instructor_roster'),
    path('api/instructor/grade/', views.api_instructor_update_grade, name='api_instructor_update_grade'),
]
