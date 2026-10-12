from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class Department(models.Model):
    dept_name = models.CharField(max_length=50, primary_key=True)
    building = models.CharField(max_length=50)
    budget = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        db_table = 'department'
        ordering = ['dept_name']
        constraints = [
            models.CheckConstraint(check=models.Q(budget__gte=0), name='chk_dept_budget_non_negative')
        ]

    def __str__(self):
        return self.dept_name


class UserAccount(models.Model):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
        ('admin', 'Admin'),
    ]

    user_id = models.CharField(max_length=50, primary_key=True)
    username = models.CharField(max_length=50, unique=True)
    password_hash = models.CharField(max_length=255)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    email = models.EmailField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_account'
        ordering = ['username']

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Student(models.Model):
    student_id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.RESTRICT, db_column='dept_name')
    tot_cred = models.IntegerField(default=0)
    user = models.OneToOneField(UserAccount, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')

    class Meta:
        db_table = 'student'
        ordering = ['student_id']
        indexes = [
            models.Index(fields=['department'], name='idx_stud_dept'),
        ]
        constraints = [
            models.CheckConstraint(check=models.Q(tot_cred__gte=0), name='chk_student_credits_non_negative')
        ]

    def __str__(self):
        return f"{self.student_id} - {self.name}"


class Instructor(models.Model):
    instructor_id = models.CharField(max_length=20, primary_key=True)
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.RESTRICT, db_column='dept_name')
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    user = models.OneToOneField(UserAccount, on_delete=models.SET_NULL, null=True, blank=True, db_column='user_id')

    class Meta:
        db_table = 'instructor'
        ordering = ['instructor_id']
        constraints = [
            models.CheckConstraint(check=models.Q(salary__gte=0), name='chk_instructor_salary_non_negative')
        ]

    def __str__(self):
        return f"{self.instructor_id} - {self.name}"


class Classroom(models.Model):
    building = models.CharField(max_length=50)
    room_number = models.CharField(max_length=20)
    capacity = models.IntegerField()

    class Meta:
        db_table = 'classroom'
        unique_together = ('building', 'room_number')
        ordering = ['building', 'room_number']
        constraints = [
            models.CheckConstraint(check=models.Q(capacity__gt=0), name='chk_classroom_capacity_positive')
        ]

    def __str__(self):
        return f"{self.building} - Rm {self.room_number} (Cap: {self.capacity})"


class TimeSlot(models.Model):
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    time_slot_id = models.CharField(max_length=20, primary_key=True)
    day = models.CharField(max_length=15, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()

    class Meta:
        db_table = 'time_slot'
        ordering = ['day', 'start_time']

    def overlaps_with(self, other):
        if self.day != other.day:
            return False
        return self.start_time < other.end_time and self.end_time > other.start_time

    def __str__(self):
        return f"{self.time_slot_id}: {self.day} {self.start_time.strftime('%H:%M')}-{self.end_time.strftime('%H:%M')}"
