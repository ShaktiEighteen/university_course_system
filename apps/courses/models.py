from django.db import models
from apps.core.models import Department, Instructor, Classroom, TimeSlot

class Course(models.Model):
    course_id = models.CharField(max_length=20, primary_key=True)
    title = models.CharField(max_length=120)
    department = models.ForeignKey(Department, on_delete=models.RESTRICT, db_column='dept_name')
    credits = models.IntegerField()

    class Meta:
        db_table = 'course'
        ordering = ['course_id']
        indexes = [
            models.Index(fields=['department'], name='idx_crs_dept'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(credits__gt=0, credits__lte=10),
                name='chk_course_credits_range'
            )
        ]

    def __str__(self):
        return f"{self.course_id} - {self.title} ({self.credits} cr)"


class Prereq(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='prerequisites', db_column='course_id')
    prereq_course = models.ForeignKey(Course, on_delete=models.RESTRICT, related_name='is_prerequisite_for', db_column='prereq_id')

    class Meta:
        db_table = 'prereq'
        unique_together = ('course', 'prereq_course')

    def __str__(self):
        return f"{self.course_id} requires {self.prereq_course_id}"


class Section(models.Model):
    SEMESTER_CHOICES = [
        ('Fall', 'Fall'),
        ('Spring', 'Spring'),
        ('Summer', 'Summer'),
        ('Winter', 'Winter'),
    ]

    section_id = models.CharField(max_length=20)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='course_id')
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES)
    year = models.IntegerField()
    classroom = models.ForeignKey(Classroom, on_delete=models.RESTRICT)
    time_slot = models.ForeignKey(TimeSlot, on_delete=models.RESTRICT, db_column='time_slot_id')
    capacity = models.IntegerField()

    class Meta:
        db_table = 'section'
        unique_together = ('course', 'section_id', 'semester', 'year')
        indexes = [
            models.Index(fields=['course', 'semester', 'year'], name='idx_sec_course_term'),
            models.Index(fields=['time_slot'], name='idx_sec_timeslot'),
            models.Index(fields=['classroom'], name='idx_sec_classroom'),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(capacity__gt=0), name='chk_sec_capacity_positive'),
            models.CheckConstraint(check=models.Q(year__gte=2000, year__lte=2100), name='chk_sec_year_valid'),
        ]

    @property
    def enrolled_count(self):
        return self.takes_set.count()

    @property
    def available_seats(self):
        return max(0, self.capacity - self.enrolled_count)

    def __str__(self):
        return f"{self.course_id}-{self.section_id} ({self.semester} {self.year})"


class Teaches(models.Model):
    instructor = models.ForeignKey(Instructor, on_delete=models.CASCADE, db_column='instructor_id')
    section = models.ForeignKey(Section, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, db_column='course_id')
    semester = models.CharField(max_length=20)
    year = models.IntegerField()

    class Meta:
        db_table = 'teaches'
        unique_together = ('instructor', 'section')

    def __str__(self):
        return f"{self.instructor.name} teaches {self.section}"
