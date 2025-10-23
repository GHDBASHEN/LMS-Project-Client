from django.contrib import admin
from .models import (
    Profile, Course, Enrollment, Lecturer, Student, CourseModule, Lesson,
    LessonFile, Quiz, Question, Answer, QuizAttempt, QuizResponse,
    Assignment, AssignmentSubmission, DiscussionForum, DiscussionPost,
    DiscussionReply, Notification, UserActivity, Certificate, LiveSession,
    LiveSessionAttendance
)

# Register your models here.

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['user__username', 'user__email']

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'category', 'lecturer', 'created_at']
    list_filter = ['difficulty', 'category', 'created_at']
    search_fields = ['title', 'description']

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'status', 'progress_percentage', 'enrolled_at']
    list_filter = ['status', 'enrolled_at']
    search_fields = ['student__username', 'course__title']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['title', 'lesson', 'due_date', 'max_points', 'is_published']
    list_filter = ['is_published', 'due_date']
    search_fields = ['title', 'description']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'notification_type', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['user__username', 'title']
