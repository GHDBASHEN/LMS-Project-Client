# serializers.py
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Course, Lecturer, Student, Enrollment, Profile, CourseModule, Lesson, 
    LessonFile, Quiz, Question, Answer, QuizAttempt, QuizResponse,
    Assignment, AssignmentSubmission, DiscussionForum, DiscussionPost,
    DiscussionReply, Notification, UserActivity, Certificate, LiveSession,
    LiveSessionAttendance
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'bio', 'profile_picture', 'phone', 
                 'date_of_birth', 'address', 'created_at', 'updated_at', 
                 'is_active', 'last_login']

class LecturerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = Lecturer
        fields = ['id', 'user', 'profile']

class CourseSerializer(serializers.ModelSerializer):
    lecturer_info = serializers.SerializerMethodField()
    modules_count = serializers.SerializerMethodField()
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'duration', 'image', 'lecturer', 
                 'lecturer_info', 'modules_count', 'students_count', 'created_at', 'updated_at']

    def get_lecturer_info(self, obj):
        if obj.lecturer and obj.lecturer.user:
            return {
                'id': obj.lecturer.user.id,
                'username': obj.lecturer.user.username,
                'email': obj.lecturer.user.email
            }
        return None

    def get_modules_count(self, obj):
        return obj.modules.count()

    def get_students_count(self, obj):
        return obj.enrollments.filter(status='enrolled').count()

class EnrollmentSerializer(serializers.ModelSerializer):
    course = CourseSerializer(read_only=True)
    student = UserSerializer(read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'enrolled_at', 'status', 
                 'progress_percentage', 'completion_date', 'grade', 'certificate_issued']

class CourseModuleSerializer(serializers.ModelSerializer):
    lessons_count = serializers.SerializerMethodField()

    class Meta:
        model = CourseModule
        fields = ['id', 'course', 'title', 'description', 'order', 'is_published', 
                 'lessons_count', 'created_at', 'updated_at']

    def get_lessons_count(self, obj):
        return obj.lessons.count()

class LessonSerializer(serializers.ModelSerializer):
    files = serializers.SerializerMethodField()
    has_quiz = serializers.SerializerMethodField()
    has_assignment = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = ['id', 'module', 'title', 'content', 'lesson_type', 
                 'duration_minutes', 'order', 'is_published', 'files',
                 'has_quiz', 'has_assignment', 'created_at', 'updated_at']

    def get_files(self, obj):
        return [{'id': f.id, 'filename': f.filename, 'file_size': f.file_size} 
                for f in obj.files.all()]

    def get_has_quiz(self, obj):
        return hasattr(obj, 'quiz')

    def get_has_assignment(self, obj):
        return hasattr(obj, 'assignment')

class QuizSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'description', 'time_limit_minutes', 
                 'passing_score', 'max_attempts', 'is_published', 'questions_count', 'created_at']

    def get_questions_count(self, obj):
        return obj.questions.count()

class QuestionSerializer(serializers.ModelSerializer):
    answers = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'quiz', 'question_text', 'question_type', 'points', 'order', 'answers']

    def get_answers(self, obj):
        return AnswerSerializer(obj.answers.all(), many=True).data

class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'question', 'answer_text', 'is_correct', 'order']

class QuizAttemptSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    quiz = QuizSerializer(read_only=True)

    class Meta:
        model = QuizAttempt
        fields = ['id', 'student', 'quiz', 'started_at', 'completed_at', 
                 'score', 'is_completed', 'attempt_number']

class AssignmentSerializer(serializers.ModelSerializer):
    submissions_count = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = ['id', 'lesson', 'title', 'description', 'due_date', 
                 'max_points', 'instructions', 'is_published', 'submissions_count', 'created_at']

    def get_submissions_count(self, obj):
        return obj.submissions.count()

class AssignmentSubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)

    class Meta:
        model = AssignmentSubmission
        fields = ['id', 'assignment', 'student', 'submission_text', 'submission_file',
                 'submitted_at', 'grade', 'feedback', 'status', 'graded_at', 'graded_by']

class DiscussionForumSerializer(serializers.ModelSerializer):
    posts_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionForum
        fields = ['id', 'course', 'title', 'description', 'is_active', 'posts_count', 'created_at']

    def get_posts_count(self, obj):
        return obj.posts.count()

class DiscussionPostSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscussionPost
        fields = ['id', 'forum', 'author', 'title', 'content', 'is_pinned', 
                 'replies_count', 'created_at', 'updated_at']

    def get_replies_count(self, obj):
        return obj.replies.count()

class DiscussionReplySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)

    class Meta:
        model = DiscussionReply
        fields = ['id', 'post', 'author', 'content', 'created_at', 'updated_at']

class NotificationSerializer(serializers.ModelSerializer):
    related_course = CourseSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'notification_type', 
                 'is_read', 'related_course', 'created_at']

class UserActivitySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    course = CourseSerializer(read_only=True)

    class Meta:
        model = UserActivity
        fields = ['id', 'user', 'activity_type', 'description', 'course', 
                 'lesson', 'timestamp', 'ip_address']

class CertificateSerializer(serializers.ModelSerializer):
    enrollment = EnrollmentSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = ['id', 'enrollment', 'certificate_number', 'issued_at', 
                 'pdf_file', 'is_valid']

class LiveSessionSerializer(serializers.ModelSerializer):
    attendance_count = serializers.SerializerMethodField()

    class Meta:
        model = LiveSession
        fields = ['id', 'course', 'title', 'description', 'scheduled_at', 
                 'duration_minutes', 'meeting_url', 'meeting_id', 'is_active', 
                 'attendance_count', 'created_at']

    def get_attendance_count(self, obj):
        return obj.attendance.count()

class LiveSessionAttendanceSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    session = LiveSessionSerializer(read_only=True)

    class Meta:
        model = LiveSessionAttendance
        fields = ['id', 'session', 'student', 'joined_at', 'left_at', 'duration_minutes']