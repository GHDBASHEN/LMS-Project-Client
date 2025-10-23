from django.urls import path, include
from .views import SignupView, LoginView, LogoutView, CreateLecturerView, AdminDashboardView, AdminDeleteUserView
from . import views
from .views import CourseListView, enroll

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),

    path('login/', LoginView.as_view(), name='login'),

    path('logout/', LogoutView.as_view(), name='logout'),

    path('create-lecturer/', CreateLecturerView.as_view(), name='create-lecturer'),

    # Admin Dashboard Views (Class-based)
    path('admin-dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin-delete-user/<int:user_id>/', AdminDeleteUserView.as_view(), name='admin-delete-user'),

    path("courses/", CourseListView.as_view(), name="courses"),

    path('enroll/', views.enroll, name='enroll'),

    # CSRF Token endpoint
    path('csrf-token/', views.get_csrf_token, name='csrf_token'),

    # Profile API Endpoints
    path('profile/', views.get_profile, name='get_profile'),
    path('profile/update/', views.update_profile, name='update_profile'),
    path('profile/upload-picture/', views.upload_profile_picture, name='upload_profile_picture'),

    # Admin API Endpoints
    path('admin/stats/', views.admin_dashboard_stats, name='admin_stats'),
    path('admin/users/', views.admin_users, name='admin_users'),
    path('admin/users/<int:user_id>/', views.admin_user_detail, name='admin_user_detail'),
    path('admin/courses/', views.admin_courses, name='admin_courses'),
    path('admin/courses/<int:course_id>/', views.admin_course_detail, name='admin_course_detail'),
    path('admin/analytics/', views.admin_analytics, name='admin_analytics'),
    path('admin/settings/', views.admin_settings, name='admin_settings'),
    path('admin/recent-activity/', views.admin_recent_activity, name='admin_recent_activity'),
    
    # Course detail endpoints
    path('courses/<int:course_id>/', views.course_detail, name='course_detail'),
    path('courses/<int:course_id>/modules/', views.course_modules, name='course_modules'),
    path('courses/<int:course_id>/assignments/', views.course_assignments, name='course_assignments'),
    
    # Lecturer endpoints
    path('lecturer/dashboard/', views.lecturer_dashboard_data, name='lecturer_dashboard_data'),
    path('lecturer/courses/', views.lecturer_courses, name='lecturer_courses'),
    path('lecturer/assignments/', views.lecturer_assignments, name='lecturer_assignments'),
    
    # Plagiarism checking endpoints
    path('plagiarism/check/', views.check_plagiarism, name='check_plagiarism'),
    path('plagiarism/check-assignment/<int:assignment_id>/', views.check_assignment_plagiarism, name='check_assignment_plagiarism'),
    path('plagiarism/status/<int:text_id>/', views.get_plagiarism_status, name='get_plagiarism_status'),
    path('plagiarism/report/<int:text_id>/', views.get_plagiarism_report, name='get_plagiarism_report'),





    # Legacy Admin Views (Function-based) - Keep for backward compatibility
    path('admin-dashboard-legacy/', views.admin_dashboard, name='admin_dashboard_legacy'),
    path('create-lecturer-legacy/', views.create_lecturer, name='create_lecturer_legacy'),
    path('create-course/', views.create_course, name='create_course'),
    path('admin-delete-user-legacy/<int:user_id>/', views.admin_delete_user, name='admin_delete_user_legacy'),
    
    # Legacy endpoints for advanced dashboard
    path('admin-stats-legacy/', views.admin_stats, name='admin_stats_legacy'),
    path('courses/', views.course_list, name='course_list'),
    path('create-student/', views.create_student, name='create_student'),
    path('courses/<int:course_id>/', views.delete_course, name='delete_course'),
    
    # Additional endpoints
    path('enrollment-status/<int:course_id>/', views.enrollment_status, name='enrollment_status'),
    path('my-courses/', views.my_courses, name='my_courses'),
    path('chatbot-api/', views.chatbot_api, name='chatbot_api'),
    path('chatbot-context/', views.chatbot_context, name='chatbot_context'),
    
    # Session management endpoints
    path('session-info/', views.session_info, name='session_info'),
    path('extend-session/', views.extend_session, name='extend_session'),
    path('check-session/', views.check_session, name='check_session'),
    path('protected-view/', views.protected_view, name='protected_view'),
    path('simple-notifications/', views.simple_notifications, name='simple_notifications'),

]
