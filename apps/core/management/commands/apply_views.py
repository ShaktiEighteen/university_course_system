from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Creates SQL views for timetable and section summaries'

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            # 1. View student timetable
            cursor.execute("""
                CREATE VIEW IF NOT EXISTS view_student_timetable AS
                SELECT 
                    t.student_id,
                    s.name AS student_name,
                    t.course_id,
                    c.title AS course_title,
                    sec.section_id,
                    t.semester,
                    t.year,
                    c.credits,
                    ts.day,
                    ts.start_time,
                    ts.end_time,
                    cr.building,
                    cr.room_number,
                    COALESCE(i.name, 'Unassigned') AS instructor_name,
                    t.grade
                FROM takes t
                JOIN student s ON t.student_id = s.student_id
                JOIN course c ON t.course_id = c.course_id
                JOIN section sec ON t.section_id = sec.id
                JOIN classroom cr ON sec.classroom_id = cr.id
                JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id
                LEFT JOIN teaches tch ON sec.id = tch.section_id
                LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id;
            """)

            # 2. View section summary
            cursor.execute("""
                CREATE VIEW IF NOT EXISTS view_section_summary AS
                SELECT 
                    sec.id AS section_pk,
                    sec.course_id,
                    c.title AS course_title,
                    sec.section_id,
                    sec.semester,
                    sec.year,
                    c.dept_name,
                    c.credits,
                    cr.building,
                    cr.room_number,
                    sec.time_slot_id,
                    ts.day,
                    ts.start_time,
                    ts.end_time,
                    sec.capacity,
                    COUNT(t.student_id) AS enrolled_count,
                    (sec.capacity - COUNT(t.student_id)) AS available_seats,
                    COALESCE(i.name, 'Unassigned') AS instructor_name
                FROM section sec
                JOIN course c ON sec.course_id = c.course_id
                JOIN classroom cr ON sec.classroom_id = cr.id
                JOIN time_slot ts ON sec.time_slot_id = ts.time_slot_id
                LEFT JOIN teaches tch ON sec.id = tch.section_id
                LEFT JOIN instructor i ON tch.instructor_id = i.instructor_id
                LEFT JOIN takes t ON sec.id = t.section_id
                GROUP BY 
                    sec.id, sec.course_id, c.title, sec.section_id, sec.semester, sec.year,
                    c.dept_name, c.credits, cr.building, cr.room_number, sec.time_slot_id,
                    ts.day, ts.start_time, ts.end_time, sec.capacity, i.name;
            """)

        self.stdout.write(self.style.SUCCESS("SQL Views successfully registered in database engine!"))
