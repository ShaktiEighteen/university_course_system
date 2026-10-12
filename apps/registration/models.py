from django.db import models
from apps.core.models import Student
from apps.courses.models import Course, Section

class Takes(models.Model):
    GRADE_CHOICES = [
        ('A+', 'A+ (4.0)'),
        ('A', 'A (4.0)'),
        ('A-', 'A- (3.7)'),
        ('B+', 'B+ (3.3)'),
        ('B', 'B (3.0)'),
        ('B-', 'B- (2.7)'),
        ('C+', 'C+ (2.3)'),
        ('C', 'C (2.0)'),
        ('C-', 'C- (1.7)'),
        ('D', 'D (1.0)'),
        ('F', 'F (0.0)'),
        ('P', 'Pass'),
        ('W', 'Withdrawn'),
        ('IP', 'In Progress'),
    ]

    PASSING_GRADES = {'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'P'}

    student = models.ForeignKey(Student, on_delete=models.CASCADE, db_column='student_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='course_id')
    semester = models.CharField(max_length=20)
    year = models.IntegerField()
    grade = models.CharField(max_length=5, choices=GRADE_CHOICES, default='IP', null=True, blank=True)
    registered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'takes'
        unique_together = ('student', 'course', 'semester', 'year')
        indexes = [
            models.Index(fields=['student', 'semester', 'year'], name='idx_takes_stud_term'),
            models.Index(fields=['section'], name='idx_takes_sec'),
        ]

    def is_passed(self):
        return self.grade in self.PASSING_GRADES

    def __str__(self):
        return f"{self.student_id} -> {self.course_id} ({self.semester} {self.year}): {self.grade}"
