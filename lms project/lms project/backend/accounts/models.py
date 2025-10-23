from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import uuid

class Profile(models.Model):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('superadmin', 'Super Admin'),
    )
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    bio = models.TextField(blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    last_login = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"

class Lecturer(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Add any additional lecturer fields here
    
    def __str__(self):
        return self.user.username

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # Add any additional student fields here
    enrolled_courses = models.ManyToManyField('Course', blank=True)
    
    def __str__(self):
        return self.user.username

class Course(models.Model):
    DIFFICULTY_CHOICES = (
        ('beginner', 'Beginner'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.CharField(max_length=100)
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='beginner')
    category = models.CharField(max_length=100, blank=True, null=True)
    image = models.URLField(blank=True, null=True)
    lecturer = models.ForeignKey(Lecturer, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title

class Enrollment(models.Model):
    STATUS_CHOICES = (
        ('enrolled', 'Enrolled'),
        ('completed', 'Completed'),
        ('dropped', 'Dropped'),
        ('suspended', 'Suspended'),
    )
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    enrolled_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='enrolled')
    progress_percentage = models.FloatField(default=0.0, validators=[MinValueValidator(0.0), MaxValueValidator(100.0)])
    completion_date = models.DateTimeField(blank=True, null=True)
    grade = models.CharField(max_length=5, blank=True, null=True)
    certificate_issued = models.BooleanField(default=False)

    class Meta:
        unique_together = ('student', 'course')

# Advanced Course Content Models
class CourseModule(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=200)
    description = models.TextField()
    order = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

class Lesson(models.Model):
    LESSON_TYPES = (
        ('video', 'Video'),
        ('text', 'Text'),
        ('quiz', 'Quiz'),
        ('assignment', 'Assignment'),
        ('live', 'Live Session'),
    )
    module = models.ForeignKey(CourseModule, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=200)
    content = models.TextField()
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPES)
    duration_minutes = models.PositiveIntegerField(default=0)
    order = models.PositiveIntegerField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order']

class LessonFile(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='files')
    file = models.FileField(upload_to='lesson_files/')
    filename = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

# Assessment System
class Quiz(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='quiz')
    title = models.CharField(max_length=200)
    description = models.TextField()
    time_limit_minutes = models.PositiveIntegerField(default=30)
    passing_score = models.FloatField(default=70.0)
    max_attempts = models.PositiveIntegerField(default=3)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class Question(models.Model):
    QUESTION_TYPES = (
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
        ('short_answer', 'Short Answer'),
        ('essay', 'Essay'),
    )
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPES)
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

class Answer(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField()

    class Meta:
        ordering = ['order']

class QuizAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE)
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(blank=True, null=True)
    score = models.FloatField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)
    attempt_number = models.PositiveIntegerField(default=1)

class QuizResponse(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='responses')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, blank=True, null=True)
    text_response = models.TextField(blank=True, null=True)
    is_correct = models.BooleanField(default=False)
    points_earned = models.FloatField(default=0.0)

# Assignment System
class Assignment(models.Model):
    lesson = models.OneToOneField(Lesson, on_delete=models.CASCADE, related_name='assignment')
    title = models.CharField(max_length=200)
    description = models.TextField()
    due_date = models.DateTimeField()
    max_points = models.PositiveIntegerField(default=100)
    instructions = models.TextField()
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class AssignmentSubmission(models.Model):
    STATUS_CHOICES = (
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
        ('returned', 'Returned'),
    )
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    submission_text = models.TextField(blank=True, null=True)
    submission_file = models.FileField(upload_to='assignment_submissions/', blank=True, null=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    grade = models.FloatField(blank=True, null=True)
    feedback = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    graded_at = models.DateTimeField(blank=True, null=True)
    graded_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='graded_assignments')

# Communication System
class DiscussionForum(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='forums')
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class DiscussionPost(models.Model):
    forum = models.ForeignKey(DiscussionForum, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    content = models.TextField()
    is_pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class DiscussionReply(models.Model):
    post = models.ForeignKey(DiscussionPost, on_delete=models.CASCADE, related_name='replies')
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# Notification System
class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('course_update', 'Course Update'),
        ('assignment_due', 'Assignment Due'),
        ('grade_posted', 'Grade Posted'),
        ('forum_reply', 'Forum Reply'),
        ('announcement', 'Announcement'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    related_course = models.ForeignKey(Course, on_delete=models.CASCADE, blank=True, null=True)

# Analytics and Tracking
class UserActivity(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50)
    description = models.TextField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, blank=True, null=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True, null=True)

# Certificate System
class Certificate(models.Model):
    enrollment = models.OneToOneField(Enrollment, on_delete=models.CASCADE, related_name='certificate')
    certificate_number = models.UUIDField(default=uuid.uuid4, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    pdf_file = models.FileField(upload_to='certificates/', blank=True, null=True)
    is_valid = models.BooleanField(default=True)

# Live Session System
class LiveSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='live_sessions')
    title = models.CharField(max_length=200)
    description = models.TextField()
    scheduled_at = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=60)
    meeting_url = models.URLField(blank=True, null=True)
    meeting_id = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class LiveSessionAttendance(models.Model):
    session = models.ForeignKey(LiveSession, on_delete=models.CASCADE, related_name='attendance')
    student = models.ForeignKey(User, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(blank=True, null=True)
    duration_minutes = models.PositiveIntegerField(default=0)