from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, permission_classes
from rest_framework import generics, permissions
from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Profile, Course, Enrollment, Lecturer, Student, Notification, Assignment, AssignmentSubmission, CourseModule, Lesson
from .plagiarism_checker import plagiarism_checker
from .serializers import CourseSerializer, EnrollmentSerializer
import json
import logging

logger = logging.getLogger(__name__)

# Session authentication decorator
def session_required(view_func):
    """Decorator to require session authentication"""
    def wrapper(request, *args, **kwargs):
        if not request.session.get('is_authenticated'):
            return Response({
                'error': 'Session authentication required'
            }, status=status.HTTP_401_UNAUTHORIZED)
        return view_func(request, *args, **kwargs)
    return wrapper

# Signup for Students
class SignupView(APIView):
    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        # Validate required fields
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not email:
            return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=username, email=email, password=password)
            # default role = student
            Profile.objects.create(user=user, role="student")
            token, _ = Token.objects.get_or_create(user=user)
            return Response({"token": token.key, "role": "student"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Error creating user: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


# Login for All Roles
class LoginView(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        # Validate required fields
        if not username:
            return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not password:
            return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if user:
            # Ensure user has a profile, create one if missing
            if not hasattr(user, 'profile'):
                Profile.objects.create(user=user, role="student")
            
            # Create token for API authentication
            token, _ = Token.objects.get_or_create(user=user)
            
            # Create session for web authentication
            request.session['user_id'] = user.id
            request.session['username'] = user.username
            request.session['role'] = user.profile.role
            request.session['is_authenticated'] = True
            
            # Ensure session is saved to get session key
            request.session.save()
            
            return Response({
                "token": token.key,
                "username": user.username,
                "role": user.profile.role,
                "session_id": request.session.session_key,
                "message": "Login successful"
            }, status=status.HTTP_200_OK)
        else:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)


# Logout View
class LogoutView(APIView):
    def post(self, request):
        # Clear session data
        request.session.flush()
        
        # If using token authentication, you can also delete the token
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                token.delete()
            except Token.DoesNotExist:
                pass
        
        return Response({
            "message": "Logout successful",
            "session_cleared": True
        }, status=status.HTTP_200_OK)


# Only Superadmin Can Create Lecturer Accounts
class CreateLecturerView(APIView):
    def post(self, request):
        try:
            # Get token from Authorization header
            auth_header = request.headers.get("Authorization", "")
            if not auth_header.startswith("Token "):
                return Response({"error": "Invalid authorization header"}, status=status.HTTP_401_UNAUTHORIZED)
            
            token_key = auth_header.split(" ")[1]
            token = Token.objects.get(key=token_key)
        except (Token.DoesNotExist, IndexError, ValueError):
            return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            logger.error(f"Error in CreateLecturerView token validation: {str(e)}")
            return Response({"error": "Authentication error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Ensure user has a profile, create one if missing
        if not hasattr(token.user, 'profile'):
            Profile.objects.create(user=token.user, role="student")
            
        if token.user.profile.role != "superadmin":
            return Response({"error": "Only superadmin can create lecturers"}, status=status.HTTP_403_FORBIDDEN)

        try:
            username = request.data.get("username")
            email = request.data.get("email")
            password = request.data.get("password")

            # Validate required fields
            if not username:
                return Response({"error": "Username is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not email:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)
            if not password:
                return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                return Response({"error": "Username already exists"}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(email=email).exists():
                return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

            user = User.objects.create_user(
                username=username, email=email, password=password)
            Profile.objects.create(user=user, role="lecturer")
            Lecturer.objects.create(user=user)
            
            logger.info(f"Lecturer created successfully: {username}")
            return Response({"message": "Lecturer account created", "role": "lecturer"}, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating lecturer: {str(e)}")
            return Response({"error": f"Error creating lecturer: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Admin: list all users
class AdminDashboardView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Ensure user has a profile, create one if missing
        if not hasattr(request.user, 'profile'):
            Profile.objects.create(user=request.user, role="student")
            
        # Only superadmin can access
        if request.user.profile.role != 'superadmin':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        users = User.objects.exclude(
            profile__role='superadmin')  # exclude other admins
        user_list = []
        for user in users:
            # Ensure user has a profile, create one if missing
            if not hasattr(user, 'profile'):
                Profile.objects.create(user=user, role="student")
            
            user_list.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': user.profile.role
            })
        return Response(user_list, status=status.HTTP_200_OK)

# Admin: delete a user
class AdminDeleteUserView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, user_id):
        # Ensure user has a profile, create one if missing
        if not hasattr(request.user, 'profile'):
            Profile.objects.create(user=request.user, role="student")
            
        if request.user.profile.role != 'superadmin':
            return Response({'error': 'Access denied'}, status=status.HTTP_403_FORBIDDEN)

        try:
            user = User.objects.get(id=user_id)
            # Ensure user has a profile, create one if missing
            if not hasattr(user, 'profile'):
                Profile.objects.create(user=user, role="student")
                
            if user.profile.role == 'superadmin':
                return Response({'error': 'Cannot delete superadmin'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response({'message': 'User deleted'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class CourseListView(generics.ListAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

# Enroll in a course
@api_view(['POST'])
@session_required
def enroll(request):
    course_id = request.data.get("course_id")
    if not course_id:
        return Response({"detail": "Course ID is required."}, status=400)
    try:
        course = Course.objects.get(id=course_id)
        # Get user from session
        user_id = request.session.get('user_id')
        if not user_id:
            return Response({"detail": "User not found in session."}, status=401)
        
        user = User.objects.get(id=user_id)
        Enrollment.objects.create(student=user, course=course)
        return Response({"message": "Enrolled successfully."})
    except Course.DoesNotExist:
        return Response({"detail": "Course not found."}, status=404)
    except User.DoesNotExist:
        return Response({"detail": "User not found."}, status=404)
    except Exception as e:
        return Response({"detail": f"Enrollment failed: {str(e)}"}, status=500)

@csrf_exempt
def enroll_course(request):
    if request.method == "POST":
        # handle enrollment logic here
        return JsonResponse({"message": "Enrolled successfully!"})
    return JsonResponse({"detail": "Method not allowed."}, status=405)

# Check enrollment status
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def enrollment_status(request, course_id):
    try:
        course = Course.objects.get(id=course_id)
        is_enrolled = Enrollment.objects.filter(
            student=request.user, 
            course=course
        ).exists()
        
        return Response({
            'course_id': course_id,
            'course_title': course.title,
            'is_enrolled': is_enrolled,
            'status': 'enrolled' if is_enrolled else 'not-enrolled'
        })
    except Course.DoesNotExist:
        return Response({'error': 'Course not found'}, status=status.HTTP_404_NOT_FOUND)

# Get user's enrolled courses
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_courses(request):
    enrollments = Enrollment.objects.filter(student=request.user).select_related('course')
    courses_data = []
    
    for enrollment in enrollments:
        courses_data.append({
            'id': enrollment.course.id,
            'title': enrollment.course.title,
            'description': enrollment.course.description,
            'duration': enrollment.course.duration,
            'image': enrollment.course.image,
            'enrolled_date': enrollment.enrolled_date
        })
    
    return Response(courses_data)

# Chatbot API Endpoint
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def chatbot_api(request):
    try:
        user_message = request.data.get('message', '').lower()
        user = request.user
        
        # Ensure user has a profile, create one if missing
        if not hasattr(user, 'profile'):
            Profile.objects.create(user=user, role="student")
            
        user_role = user.profile.role
        
        # Get user's enrolled courses for personalized responses
        user_courses = Enrollment.objects.filter(student=user).select_related('course')
        enrolled_course_titles = [enrollment.course.title for enrollment in user_courses]
        
        # Enhanced response logic based on user message and context
        if any(word in user_message for word in ['hello', 'hi', 'hey', 'greetings']):
            response_text = f"Hello {user.username}! 👋 I'm your course assistant. I can help you with course information, enrollment, progress tracking, and more. What would you like to know?"
        
        elif any(word in user_message for word in ['course', 'enroll', 'available']):
            if user_role == 'student':
                if enrolled_course_titles:
                    response_text = f"You're currently enrolled in: {', '.join(enrolled_course_titles)}. You can browse more courses in the Courses section."
                else:
                    response_text = "You can browse all available courses in the 'Courses' section. To enroll, click the 'Enroll Now' button on any course card."
            else:
                response_text = "You can view all available courses in the Courses section. As a lecturer/admin, you have additional management capabilities."
        
        elif any(word in user_message for word in ['progress', 'complete', 'tracking']):
            if user_role == 'student':
                if enrolled_course_titles:
                    response_text = f"You can check your progress for {', '.join(enrolled_course_titles)} in your Student Dashboard. It shows completed lessons and overall course progress."
                else:
                    response_text = "You're not enrolled in any courses yet. Once you enroll, you'll be able to track your progress in the Student Dashboard."
            else:
                response_text = "Student progress tracking is available in the dashboard. As a lecturer, you can view student progress for your courses."
        
        elif any(word in user_message for word in ['assignment', 'homework', 'submit']):
            response_text = "Assignments are available within each course page. You can submit your work directly through the course interface and track grades in your dashboard."
        
        elif any(word in user_message for word in ['profile', 'account', 'information']):
            response_text = "You can update your personal information, profile picture, and preferences in the Profile section accessible from the navigation menu."
        
        elif any(word in user_message for word in ['help', 'support', 'problem']):
            response_text = "I'm here to help! I can assist with: course enrollment, progress tracking, assignment submission, profile management, and general platform navigation. What specific issue are you facing?"
        
        elif any(word in user_message for word in ['programming', 'code', 'develop']):
            response_text = "We offer several programming courses: Programming Laboratory, Fundamentals of Programming, Python Programming, Open Source Development, and more. These cover everything from basics to advanced topics."
        
        elif any(word in user_message for word in ['deadline', 'due', 'time']):
            response_text = "Assignment deadlines are shown on each assignment card in your course. You can also view all upcoming deadlines in your Student Dashboard."
        
        elif any(word in user_message for word in ['certificate', 'completion', 'certification']):
            response_text = "Yes! You'll receive a certificate upon successful completion of any course. Certificates are automatically generated and available for download from your dashboard once you complete all course requirements."
        
        elif any(word in user_message for word in ['payment', 'fee', 'cost']):
            response_text = "Most of our courses are completely free! Any course fees (if applicable) will be clearly indicated on the course page before enrollment."
        
        elif any(word in user_message for word in ['technical', 'issue', 'bug', 'error']):
            response_text = "For technical issues, please try refreshing the page first. If the problem persists, contact our support team with details about the issue and any error messages you're seeing."
        
        elif any(word in user_message for word in ['dashboard', 'home', 'main']):
            if user_role == 'student':
                response_text = "Your Student Dashboard shows your enrolled courses, progress, upcoming assignments, and recent activity. You can access it from the navigation menu."
            elif user_role == 'lecturer':
                response_text = "Your Lecturer Dashboard allows you to manage your courses, view student progress, and create assignments. Access it from the navigation menu."
            elif user_role == 'superadmin':
                response_text = "Your Admin Dashboard provides user management, course administration, and system analytics. Access it from the navigation menu."
        
        else:
            # Default response for unrecognized queries
            response_text = f"I understand you're asking about: '{user_message}'. I can help you with course-related questions, enrollment, progress tracking, assignments, and platform navigation. Could you please rephrase your question or ask about something specific?"
        
        # Log the interaction for analytics
        logger.info(f"Chatbot interaction - User: {user.username}, Message: {user_message}, Response: {response_text[:100]}...")
        
        return Response({
            'response': response_text,
            'status': 'success',
            'user_role': user_role
        })
        
    except Exception as e:
        logger.error(f"Chatbot API error: {str(e)}")
        return Response({
            'response': "I'm having trouble processing your request right now. Please try again later or contact support if the issue persists.",
            'status': 'error'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Get user profile data for chatbot context
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def chatbot_context(request):
    user = request.user
    
    # Ensure user has a profile, create one if missing
    if not hasattr(user, 'profile'):
        Profile.objects.create(user=user, role="student")
        
    user_courses = Enrollment.objects.filter(student=user).select_related('course')
    
    context = {
        'username': user.username,
        'role': user.profile.role,
        'enrolled_courses': [
            {
                'title': enrollment.course.title,
                'enrolled_date': enrollment.enrolled_at
            }
            for enrollment in user_courses
        ],
        'total_courses': user_courses.count()
    }
    
    return Response(context)




@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Get dashboard statistics for admin"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can access this endpoint"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        total_users = User.objects.count()
        total_lecturers = Lecturer.objects.count()
        total_students = Student.objects.count()
        total_courses = Course.objects.count()
        
        stats = {
            'totalUsers': total_users,
            'totalLecturers': total_lecturers,
            'totalStudents': total_students,
            'totalCourses': total_courses,
        }
        
        return Response(stats)
    
    except Exception as e:
        return Response(
            {"error": f"Error fetching stats: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def course_list(request):
    """Get all courses with lecturer information"""
    try:
        courses = Course.objects.select_related('lecturer__user').all()
        serializer = CourseSerializer(courses, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            {"error": f"Error fetching courses: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_student(request):
    """Create a new student account"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can create student accounts"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not all([username, email, password]):
        return Response(
            {"error": "Username, email, and password are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create student profile
        student = Student.objects.create(user=user)
        
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "message": "Student account created successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Clean up if user creation fails
        if User.objects.filter(username=username).exists():
            User.objects.filter(username=username).delete()
        return Response(
            {"error": f"Error creating student: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_course(request, course_id):
    """Delete a course"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can delete courses"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        course = Course.objects.get(id=course_id)
        course_title = course.title
        course.delete()
        
        return Response({
            "message": f"Course '{course_title}' deleted successfully"
        }, status=status.HTTP_200_OK)
        
    except Course.DoesNotExist:
        return Response(
            {"error": "Course not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error deleting course: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard(request):
    """Get all users for admin dashboard"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can access this endpoint"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        users = User.objects.select_related('student', 'lecturer').all()
        
        user_data = []
        for user in users:
            role = 'student' if hasattr(user, 'student') else \
                   'lecturer' if hasattr(user, 'lecturer') else \
                   'admin' if user.is_superuser else 'user'
            
            user_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'role': role
            })
        
        return Response(user_data)
    
    except Exception as e:
        return Response(
            {"error": f"Error fetching users: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_lecturer(request):
    """Create a new lecturer account"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can create lecturer accounts"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if not all([username, email, password]):
        return Response(
            {"error": "Username, email, and password are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already exists"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )
        
        # Create lecturer profile
        lecturer = Lecturer.objects.create(user=user)
        Profile.objects.create(user=user, role="lecturer")
        
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "message": "Lecturer account created successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        # Clean up if user creation fails
        if User.objects.filter(username=username).exists():
            User.objects.filter(username=username).delete()
        return Response(
            {"error": f"Error creating lecturer: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_course(request):
    """Create a new course"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can create courses"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    title = request.data.get('title')
    description = request.data.get('description')
    duration = request.data.get('duration')
    image = request.data.get('image', '')
    lecturer_id = request.data.get('lecturer_id')
    
    if not all([title, description, duration]):
        return Response(
            {"error": "Title, description, and duration are required"}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        lecturer = None
        if lecturer_id:
            lecturer = Lecturer.objects.get(id=lecturer_id)
        
        course = Course.objects.create(
            title=title,
            description=description,
            duration=duration,
            image=image,
            lecturer=lecturer
        )
        
        return Response({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "duration": course.duration,
            "image": course.image,
            "lecturer": lecturer.user.username if lecturer else None,
            "message": "Course created successfully"
        }, status=status.HTTP_201_CREATED)
        
    except Lecturer.DoesNotExist:
        return Response(
            {"error": "Lecturer not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error creating course: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_user(request, user_id):
    """Delete a user (admin only)"""
    if not request.user.is_superuser:
        return Response(
            {"error": "Only superusers can delete users"}, 
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        user = User.objects.get(id=user_id)
        if user.is_superuser:
            return Response(
                {"error": "Cannot delete superuser"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        username = user.username
        user.delete()
        
        return Response({
            "message": f"User '{username}' deleted successfully"
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {"error": "User not found"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": f"Error deleting user: {str(e)}"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# Session Management Views

@api_view(['GET'])
def session_info(request):
    """Get current session information"""
    if request.session.get('is_authenticated'):
        return Response({
            'is_authenticated': True,
            'user_id': request.session.get('user_id'),
            'username': request.session.get('username'),
            'role': request.session.get('role'),
            'session_id': request.session.session_key,
            'session_expiry': request.session.get_expiry_age()
        })
    else:
        return Response({
            'is_authenticated': False,
            'message': 'No active session'
        })

@api_view(['POST'])
def extend_session(request):
    """Extend session expiry time"""
    if request.session.get('is_authenticated'):
        # Set session to expire in 2 hours (7200 seconds)
        request.session.set_expiry(7200)
        return Response({
            'message': 'Session extended',
            'new_expiry': request.session.get_expiry_age()
        })
    else:
        return Response({
            'error': 'No active session to extend'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
def check_session(request):
    """Check if session is valid and user is authenticated"""
    if request.session.get('is_authenticated'):
        try:
            user = User.objects.get(id=request.session.get('user_id'))
            # Ensure user still exists and is active
            if user.is_active:
                return Response({
                    'valid': True,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'role': request.session.get('role')
                    }
                })
            else:
                # User is inactive, clear session
                request.session.flush()
                return Response({
                    'valid': False,
                    'message': 'User account is inactive'
                })
        except User.DoesNotExist:
            # User doesn't exist, clear session
            request.session.flush()
            return Response({
                'valid': False,
                'message': 'User not found'
            })
    else:
        return Response({
            'valid': False,
            'message': 'No active session'
        })

# Simple notifications endpoint for testing
@api_view(['GET'])
def simple_notifications(request):
    """Simple notifications endpoint for testing"""
    if request.user.is_authenticated:
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:5]
        return Response([{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'notification_type': n.notification_type,
            'is_read': n.is_read,
            'created_at': n.created_at
        } for n in notifications])
    else:
        return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

# Session-based protected view example
@api_view(['GET'])
@session_required
def protected_view(request):
    """Example of a session-protected view"""
    return Response({
        'message': 'This is a protected view',
        'user': request.session.get('username'),
        'role': request.session.get('role')
    })

@api_view(['GET'])
def get_csrf_token(request):
    """Get CSRF token for frontend"""
    from django.middleware.csrf import get_token
    token = get_token(request)
    return Response({'csrf_token': token})

# ==================== PROFILE API ENDPOINTS ====================

@api_view(['GET'])
def get_profile(request):
    """Get current user's profile data"""
    try:
        # Try to get user from session first, then from token
        user_id = request.session.get('user_id')
        if user_id:
            user = User.objects.get(id=user_id)
        else:
            # Fallback to token authentication
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Token '):
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
            except Token.DoesNotExist:
                return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        profile = user.profile
        
        # Get user's enrollments
        enrollments = Enrollment.objects.filter(student=user).select_related('course')
        courses_data = []
        for enrollment in enrollments:
            courses_data.append({
                'id': enrollment.course.id,
                'title': enrollment.course.title,
                'description': enrollment.course.description,
                'duration': enrollment.course.duration,
                'difficulty': enrollment.course.difficulty,
                'category': enrollment.course.category,
                'image': enrollment.course.image,
                'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None,
                'progress': enrollment.progress if hasattr(enrollment, 'progress') else 0
            })
        
        # Get user's assignments (simplified for now)
        assignments_data = []
        try:
            # Get assignments from courses the user is enrolled in
            enrolled_courses = Course.objects.filter(enrollment__student=user)
            for course in enrolled_courses:
                # Get assignments from course modules and lessons
                from .models import CourseModule, Lesson
                modules = CourseModule.objects.filter(course=course)
                for module in modules:
                    lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
                    for lesson in lessons:
                        try:
                            assignment = Assignment.objects.get(lesson=lesson)
                            try:
                                submission = AssignmentSubmission.objects.get(assignment=assignment, student=user)
                                submission_data = {
                                    'id': submission.id,
                                    'submitted_at': submission.submitted_at.isoformat(),
                                    'grade': submission.grade,
                                    'feedback': submission.feedback,
                                    'status': 'submitted'
                                }
                            except AssignmentSubmission.DoesNotExist:
                                submission_data = {
                                    'status': 'not_submitted',
                                    'grade': None,
                                    'feedback': None
                                }
                            
                            assignments_data.append({
                                'id': assignment.id,
                                'title': assignment.title,
                                'description': assignment.description,
                                'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                                'course_title': course.title,
                                'submission': submission_data
                            })
                        except Assignment.DoesNotExist:
                            continue
        except Exception as e:
            print(f"Assignment error: {e}")
            assignments_data = []
        
        # Get user's notifications
        notifications = Notification.objects.filter(user=user).order_by('-created_at')[:10]
        notifications_data = []
        for notification in notifications:
            notifications_data.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.type,
                'created_at': notification.created_at.isoformat(),
                'is_read': notification.is_read
            })
        
        profile_data = {
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'date_joined': user.date_joined.isoformat()
            },
            'profile': {
                'id': profile.id,
                'role': profile.role,
                'bio': profile.bio if hasattr(profile, 'bio') else '',
                'profile_picture': profile.profile_picture.url if hasattr(profile, 'profile_picture') and profile.profile_picture else None,
                'phone': profile.phone if hasattr(profile, 'phone') else '',
                'address': profile.address if hasattr(profile, 'address') else '',
                'date_of_birth': profile.date_of_birth.isoformat() if hasattr(profile, 'date_of_birth') and profile.date_of_birth else None
            },
            'courses': courses_data,
            'assignments': assignments_data,
            'notifications': notifications_data,
            'stats': {
                'total_courses': len(courses_data),
                'completed_courses': len([c for c in courses_data if c.get('progress', 0) == 100]),
                'pending_assignments': len([a for a in assignments_data if a['submission']['status'] == 'not_submitted']),
                'unread_notifications': len([n for n in notifications_data if not n['is_read']])
            }
        }
        
        return Response(profile_data)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
def update_profile(request):
    """Update current user's profile"""
    try:
        # Try to get user from session first, then from token
        user_id = request.session.get('user_id')
        if user_id:
            user = User.objects.get(id=user_id)
        else:
            # Fallback to token authentication
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Token '):
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
            except Token.DoesNotExist:
                return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        profile = user.profile
        
        # Update user fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            user.email = request.data['email']
        user.save()
        
        # Update profile fields
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        if 'address' in request.data:
            profile.address = request.data['address']
        if 'date_of_birth' in request.data:
            from datetime import datetime
            try:
                profile.date_of_birth = datetime.fromisoformat(request.data['date_of_birth'].replace('Z', '+00:00'))
            except:
                pass
        profile.save()
        
        return Response({"message": "Profile updated successfully"})
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def upload_profile_picture(request):
    """Upload profile picture"""
    try:
        # Try to get user from session first, then from token
        user_id = request.session.get('user_id')
        if user_id:
            user = User.objects.get(id=user_id)
        else:
            # Fallback to token authentication
            auth_header = request.headers.get('Authorization', '')
            if not auth_header.startswith('Token '):
                return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
            
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                user = token.user
            except Token.DoesNotExist:
                return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        profile = user.profile
        
        if 'profile_picture' in request.FILES:
            profile.profile_picture = request.FILES['profile_picture']
            profile.save()
            return Response({
                "message": "Profile picture uploaded successfully",
                "profile_picture_url": profile.profile_picture.url
            })
        else:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ==================== ADMIN API ENDPOINTS ====================

@api_view(['GET'])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        stats = {
            'total_users': User.objects.count(),
            'total_lecturers': Profile.objects.filter(role='lecturer').count(),
            'total_students': Profile.objects.filter(role='student').count(),
            'total_courses': Course.objects.count(),
            'total_assignments': Assignment.objects.count(),
            'total_enrollments': Enrollment.objects.count(),
            'active_sessions': 0,  # This would need session tracking
            'system_health': 95
        }
        return Response(stats)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def admin_users(request):
    """Admin user management"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        try:
            users = User.objects.all().select_related('profile')
            user_data = []
            for user in users:
                user_data.append({
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.profile.role if hasattr(user, 'profile') else 'student',
                    'is_active': user.is_active,
                    'date_joined': user.date_joined
                })
            return Response({'users': user_data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            first_name = data.get('first_name', '')
            last_name = data.get('last_name', '')
            role = data.get('role', 'student')
            
            if not username or not email or not password:
                return Response({"error": "Username, email, and password are required"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Check if user already exists
            if User.objects.filter(username=username).exists():
                return Response({"error": "Username already exists"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            if User.objects.filter(email=email).exists():
                return Response({"error": "Email already exists"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create profile
            Profile.objects.create(
                user=user,
                role=role
            )
            
            # Create corresponding model instance based on role
            if role == 'lecturer':
                Lecturer.objects.create(user=user)
            elif role == 'student':
                Student.objects.create(user=user)
            
            return Response({
                "message": "User created successfully",
                "user_id": user.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT', 'DELETE'])
def admin_user_detail(request, user_id):
    """Admin user detail operations"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        try:
            data = request.data
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            
            if data.get('password'):
                user.set_password(data['password'])
            
            user.save()
            
            # Update profile role
            if hasattr(user, 'profile'):
                user.profile.role = data.get('role', user.profile.role)
                user.profile.save()
            
            return Response({"message": "User updated successfully"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            user.delete()
            return Response({"message": "User deleted successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def admin_courses(request):
    """Admin course management"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        try:
            courses = Course.objects.all().select_related('lecturer')
            course_data = []
            for course in courses:
                course_data.append({
                    'id': course.id,
                    'title': course.title,
                    'description': course.description,
                    'duration': course.duration,
                    'difficulty': course.difficulty,
                    'category': course.category,
                    'lecturer': course.lecturer.user.get_full_name() if course.lecturer else 'Unassigned',
                    'lecturer_id': course.lecturer.id if course.lecturer else None,
                    'enrollments': Enrollment.objects.filter(course=course).count(),
                    'created_at': course.created_at
                })
            return Response({'courses': course_data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'POST':
        try:
            data = request.data
            title = data.get('title')
            description = data.get('description')
            duration = data.get('duration')
            difficulty = data.get('difficulty', 'beginner')
            category = data.get('category', '')
            lecturer_id = data.get('lecturer_id')
            
            if not title or not description:
                return Response({"error": "Title and description are required"}, 
                              status=status.HTTP_400_BAD_REQUEST)
            
            lecturer = None
            if lecturer_id:
                try:
                    lecturer = Lecturer.objects.get(id=lecturer_id)
                except Lecturer.DoesNotExist:
                    return Response({"error": "Lecturer not found"}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            
            course = Course.objects.create(
                title=title,
                description=description,
                duration=duration,
                difficulty=difficulty,
                category=category,
                lecturer=lecturer
            )
            
            return Response({
                "message": "Course created successfully",
                "course_id": course.id
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT', 'DELETE'])
def admin_course_detail(request, course_id):
    """Admin course detail operations"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        try:
            data = request.data
            course.title = data.get('title', course.title)
            course.description = data.get('description', course.description)
            course.duration = data.get('duration', course.duration)
            course.difficulty = data.get('difficulty', course.difficulty)
            course.category = data.get('category', course.category)
            
            lecturer_id = data.get('lecturer_id')
            if lecturer_id:
                try:
                    course.lecturer = Lecturer.objects.get(id=lecturer_id)
                except Lecturer.DoesNotExist:
                    return Response({"error": "Lecturer not found"}, 
                                  status=status.HTTP_400_BAD_REQUEST)
            
            course.save()
            return Response({"message": "Course updated successfully"})
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'DELETE':
        try:
            course.delete()
            return Response({"message": "Course deleted successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def admin_analytics(request):
    """Admin analytics data"""
    # Check admin access - try session first, then token
    user_role = None
    
    # Try session authentication first
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # User growth (last 6 months)
        user_growth = []
        for i in range(6):
            date = timezone.now() - timedelta(days=30*i)
            count = User.objects.filter(date_joined__lte=date).count()
            user_growth.append({
                'month': date.strftime('%b'),
                'users': count
            })
        user_growth.reverse()
        
        # Course popularity
        course_popularity = []
        for course in Course.objects.all():
            enrollments = Enrollment.objects.filter(course=course).count()
            course_popularity.append({
                'course': course.title,
                'enrollments': enrollments
            })
        course_popularity.sort(key=lambda x: x['enrollments'], reverse=True)
        
        # Assignment submissions (last 7 days)
        assignment_submissions = []
        for i in range(7):
            date = timezone.now() - timedelta(days=i)
            count = AssignmentSubmission.objects.filter(submitted_at__date=date.date()).count()
            assignment_submissions.append({
                'date': date.strftime('%Y-%m-%d'),
                'submissions': count
            })
        assignment_submissions.reverse()
        
        # System performance (mock data)
        system_performance = [
            {'metric': 'CPU Usage', 'value': 45},
            {'metric': 'Memory Usage', 'value': 67},
            {'metric': 'Disk Usage', 'value': 23},
            {'metric': 'Database Connections', 'value': 12}
        ]
        
        analytics_data = {
            'user_growth': user_growth,
            'course_popularity': course_popularity[:5],  # Top 5 courses
            'assignment_submissions': assignment_submissions,
            'system_performance': system_performance
        }
        
        return Response(analytics_data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def course_detail(request, course_id):
    """Get detailed course information"""
    try:
        course = Course.objects.select_related('lecturer__user').get(id=course_id)
        
        course_data = {
            'id': course.id,
            'title': course.title,
            'description': course.description,
            'duration': course.duration,
            'difficulty': course.difficulty,
            'category': course.category,
            'image': course.image,
            'lecturer': {
                'id': course.lecturer.id if course.lecturer else None,
                'user': {
                    'first_name': course.lecturer.user.first_name if course.lecturer else '',
                    'last_name': course.lecturer.user.last_name if course.lecturer else '',
                    'username': course.lecturer.user.username if course.lecturer else ''
                }
            } if course.lecturer else None,
            'created_at': course.created_at.isoformat() if course.created_at else None
        }
        
        return Response(course_data)
    except Course.DoesNotExist:
        return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def course_modules(request, course_id):
    """Get course modules and lessons"""
    try:
        course = Course.objects.get(id=course_id)
        modules = CourseModule.objects.filter(course=course).prefetch_related('lessons').order_by('order')
        
        modules_data = []
        for module in modules:
            lessons_data = []
            for lesson in module.lessons.all():
                lessons_data.append({
                    'id': lesson.id,
                    'title': lesson.title,
                    'description': lesson.content,
                    'lesson_type': lesson.lesson_type,
                    'duration': f"{lesson.duration_minutes} minutes",
                    'order': lesson.order,
                    'is_published': lesson.is_published
                })
            
            modules_data.append({
                'id': module.id,
                'title': module.title,
                'description': module.description,
                'order': module.order,
                'is_published': module.is_published,
                'lessons': lessons_data
            })
        
        return Response({'modules': modules_data})
    except Course.DoesNotExist:
        return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def course_assignments(request, course_id):
    """Get course assignments"""
    try:
        course = Course.objects.get(id=course_id)
        
        # Get assignments from course modules and lessons
        assignments = []
        modules = CourseModule.objects.filter(course=course)
        for module in modules:
            lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
            for lesson in lessons:
                try:
                    assignment = Assignment.objects.get(lesson=lesson)
                    assignments.append({
                        'id': assignment.id,
                        'title': assignment.title,
                        'description': assignment.description,
                        'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                        'max_points': assignment.max_points,
                        'instructions': assignment.instructions,
                        'is_published': assignment.is_published,
                        'created_at': assignment.created_at.isoformat()
                    })
                except Assignment.DoesNotExist:
                    continue
        
        return Response({'assignments': assignments})
    except Course.DoesNotExist:
        return Response({"error": "Course not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def lecturer_dashboard_data(request):
    """Get lecturer dashboard data including courses, students, and assignments"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is a lecturer
        try:
            profile = user.profile
            if profile.role != 'lecturer':
                return Response({"error": "Lecturer access required"}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get lecturer instance
        try:
            lecturer = Lecturer.objects.get(user=user)
        except Lecturer.DoesNotExist:
            return Response({"error": "Lecturer profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get lecturer's courses
        courses = Course.objects.filter(lecturer=lecturer).select_related('lecturer__user')
        courses_data = []
        
        for course in courses:
            # Get enrollment count for this course
            enrollment_count = Enrollment.objects.filter(course=course).count()
            
            # Get assignment count for this course
            assignment_count = 0
            modules = CourseModule.objects.filter(course=course)
            for module in modules:
                lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
                assignment_count += Assignment.objects.filter(lesson__in=lessons).count()
            
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'duration': course.duration,
                'difficulty': course.difficulty,
                'category': course.category,
                'image': course.image,
                'enrollment_count': enrollment_count,
                'assignment_count': assignment_count,
                'created_at': course.created_at.isoformat() if course.created_at else None
            })
        
        # Get total students across all courses
        total_students = Enrollment.objects.filter(course__lecturer=lecturer).values('student').distinct().count()
        
        # Get assignments for grading
        assignments_data = []
        for course in courses:
            modules = CourseModule.objects.filter(course=course)
            for module in modules:
                lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
                assignments = Assignment.objects.filter(lesson__in=lessons)
                for assignment in assignments:
                    # Get submission count
                    submission_count = AssignmentSubmission.objects.filter(assignment=assignment).count()
                    assignments_data.append({
                        'id': assignment.id,
                        'title': assignment.title,
                        'description': assignment.description,
                        'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                        'max_points': assignment.max_points,
                        'instructions': assignment.instructions,
                        'is_published': assignment.is_published,
                        'course_title': course.title,
                        'course_id': course.id,
                        'submission_count': submission_count,
                        'created_at': assignment.created_at.isoformat()
                    })
        
        # Get recent notifications
        notifications_data = []
        notifications = Notification.objects.filter(
            user=user
        ).order_by('-created_at')[:10]
        
        for notification in notifications:
            notifications_data.append({
                'id': notification.id,
                'title': notification.title,
                'message': notification.message,
                'type': notification.type,
                'is_read': notification.is_read,
                'timestamp': notification.created_at.isoformat()
            })
        
        # Calculate statistics
        total_assignments = len(assignments_data)
        pending_grading = sum(1 for assignment in assignments_data if assignment['submission_count'] > 0)
        
        dashboard_data = {
            'lecturer': {
                'id': lecturer.id,
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name
                }
            },
            'courses': courses_data,
            'assignments': assignments_data,
            'notifications': notifications_data,
            'stats': {
                'total_courses': len(courses_data),
                'total_students': total_students,
                'total_assignments': total_assignments,
                'pending_grading': pending_grading
            }
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def lecturer_courses(request):
    """Get courses taught by the lecturer"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is a lecturer
        try:
            profile = user.profile
            if profile.role != 'lecturer':
                return Response({"error": "Lecturer access required"}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get lecturer instance
        try:
            lecturer = Lecturer.objects.get(user=user)
        except Lecturer.DoesNotExist:
            return Response({"error": "Lecturer profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get lecturer's courses with detailed information
        courses = Course.objects.filter(lecturer=lecturer).select_related('lecturer__user')
        courses_data = []
        
        for course in courses:
            # Get enrollment count and student details
            enrollments = Enrollment.objects.filter(course=course).select_related('student')
            enrollment_count = enrollments.count()
            
            # Get assignment count
            assignment_count = 0
            modules = CourseModule.objects.filter(course=course)
            for module in modules:
                lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
                assignment_count += Assignment.objects.filter(lesson__in=lessons).count()
            
            # Get recent enrollments
            recent_enrollments = enrollments.order_by('-enrolled_at')[:5]
            recent_students = []
            for enrollment in recent_enrollments:
                recent_students.append({
                    'id': enrollment.student.id,
                    'username': enrollment.student.username,
                    'first_name': enrollment.student.first_name,
                    'last_name': enrollment.student.last_name,
                    'enrolled_at': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else None
                })
            
            courses_data.append({
                'id': course.id,
                'title': course.title,
                'description': course.description,
                'duration': course.duration,
                'difficulty': course.difficulty,
                'category': course.category,
                'image': course.image,
                'enrollment_count': enrollment_count,
                'assignment_count': assignment_count,
                'recent_students': recent_students,
                'created_at': course.created_at.isoformat() if course.created_at else None
            })
        
        return Response({'courses': courses_data})
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def lecturer_assignments(request):
    """Get assignments for lecturer's courses"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is a lecturer
        try:
            profile = user.profile
            if profile.role != 'lecturer':
                return Response({"error": "Lecturer access required"}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get lecturer instance
        try:
            lecturer = Lecturer.objects.get(user=user)
        except Lecturer.DoesNotExist:
            return Response({"error": "Lecturer profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get assignments from lecturer's courses
        assignments_data = []
        courses = Course.objects.filter(lecturer=lecturer)
        
        for course in courses:
            modules = CourseModule.objects.filter(course=course)
            for module in modules:
                lessons = Lesson.objects.filter(module=module, lesson_type='assignment')
                assignments = Assignment.objects.filter(lesson__in=lessons)
                
                for assignment in assignments:
                    # Get submission details
                    submissions = AssignmentSubmission.objects.filter(assignment=assignment).select_related('student')
                    submission_count = submissions.count()
                    
                    # Get graded and ungraded counts
                    graded_count = submissions.filter(grade__isnull=False).count()
                    ungraded_count = submission_count - graded_count
                    
                    submissions_data = []
                    for submission in submissions[:5]:  # Get recent 5 submissions
                        submissions_data.append({
                            'id': submission.id,
                            'student': {
                                'id': submission.student.id,
                                'username': submission.student.username,
                                'first_name': submission.student.first_name,
                                'last_name': submission.student.last_name
                            },
                            'submitted_at': submission.submitted_at.isoformat() if submission.submitted_at else None,
                            'grade': submission.grade,
                            'feedback': submission.feedback,
                            'is_graded': submission.grade is not None
                        })
                    
                    assignments_data.append({
                        'id': assignment.id,
                        'title': assignment.title,
                        'description': assignment.description,
                        'due_date': assignment.due_date.isoformat() if assignment.due_date else None,
                        'max_points': assignment.max_points,
                        'instructions': assignment.instructions,
                        'is_published': assignment.is_published,
                        'course_title': course.title,
                        'course_id': course.id,
                        'submission_count': submission_count,
                        'graded_count': graded_count,
                        'ungraded_count': ungraded_count,
                        'recent_submissions': submissions_data,
                        'created_at': assignment.created_at.isoformat()
                    })
        
        return Response({'assignments': assignments_data})
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def check_plagiarism(request):
    """Check text for plagiarism"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get text from request
        text = request.data.get('text', '')
        language = request.data.get('language', 'en')
        
        if not text:
            return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check plagiarism
        result = plagiarism_checker.check_text_complete(text, language)
        
        if result.get("success"):
            return Response({
                "success": True,
                "text_id": result["text_id"],
                "report": result["report"]
            })
        else:
            return Response({"error": result.get("error", "Plagiarism check failed")}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def check_assignment_plagiarism(request, assignment_id):
    """Check assignment submission for plagiarism"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is lecturer or student
        try:
            profile = user.profile
            if profile.role not in ['lecturer', 'student']:
                return Response({"error": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response({"error": "Profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get assignment
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({"error": "Assignment not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get submission text
        submission_text = request.data.get('text', '')
        if not submission_text:
            return Response({"error": "Submission text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check plagiarism
        result = plagiarism_checker.check_text_complete(submission_text)
        
        if result.get("success"):
            # Store plagiarism check result
            report = result["report"]
            plagiarism_score = report.get("percent", 0)
            
            # Create notification for lecturer if student submitted
            if profile.role == 'student':
                try:
                    lecturer = assignment.lesson.module.course.lecturer
                    if lecturer:
                        Notification.objects.create(
                            user=lecturer.user,
                            title="Plagiarism Check Completed",
                            message=f"Assignment '{assignment.title}' plagiarism check completed. Score: {plagiarism_score}%",
                            type="plagiarism"
                        )
                except:
                    pass
            
            return Response({
                "success": True,
                "assignment_id": assignment_id,
                "plagiarism_score": plagiarism_score,
                "report": report,
                "message": f"Plagiarism check completed. Similarity: {plagiarism_score}%"
            })
        else:
            return Response({"error": result.get("error", "Plagiarism check failed")}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_plagiarism_status(request, text_id):
    """Get plagiarism check status"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Check status
        result = plagiarism_checker.check_status(text_id)
        
        if result.get("success"):
            return Response({
                "success": True,
                "text_id": text_id,
                "status": result["status"],
                "status_name": result["status_name"]
            })
        else:
            return Response({"error": result.get("error", "Failed to check status")}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_plagiarism_report(request, text_id):
    """Get plagiarism report"""
    try:
        # Get user from session or token
        user = None
        user_id = request.session.get('user_id')
        
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        # Fallback to token authentication
        if not user:
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    user = token.user
                except Token.DoesNotExist:
                    return Response({"error": "Invalid token"}, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get report
        result = plagiarism_checker.get_report(text_id)
        
        if result.get("success"):
            return Response({
                "success": True,
                "text_id": text_id,
                "report": result["report"]
            })
        else:
            return Response({"error": result.get("error", "Failed to get report")}, 
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def admin_recent_activity(request):
    """Get recent activity for admin dashboard"""
    try:
        # Check if user is admin
        user_role = None
        if request.session.get('role') == 'superadmin':
            user_role = 'superadmin'
        else:
            # Fallback to token authentication
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Token '):
                token_key = auth_header.split(' ')[1]
                try:
                    token = Token.objects.get(key=token_key)
                    if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                        user_role = 'superadmin'
                except Token.DoesNotExist:
                    pass
        
        if user_role != 'superadmin':
            return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
        
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Get recent activities (last 7 days)
        recent_date = timezone.now() - timedelta(days=7)
        
        activities = []
        
        # Recent user registrations
        recent_users = User.objects.filter(date_joined__gte=recent_date).order_by('-date_joined')[:5]
        for user in recent_users:
            activities.append({
                'id': f"user_{user.id}",
                'type': 'user_registered',
                'title': 'New user registered',
                'description': f'{user.first_name} {user.last_name} ({user.username}) joined as {user.profile.role}',
                'timestamp': user.date_joined.isoformat(),
                'icon': 'fas fa-user-plus'
            })
        
        # Recent course enrollments
        recent_enrollments = Enrollment.objects.filter(enrolled_at__gte=recent_date).order_by('-enrolled_at')[:5]
        for enrollment in recent_enrollments:
            activities.append({
                'id': f"enrollment_{enrollment.id}",
                'type': 'course_enrollment',
                'title': 'Course enrollment',
                'description': f'{enrollment.student.username} enrolled in {enrollment.course.title}',
                'timestamp': enrollment.enrolled_at.isoformat() if enrollment.enrolled_at else timezone.now().isoformat(),
                'icon': 'fas fa-book-open'
            })
        
        # Recent course creations
        recent_courses = Course.objects.filter(created_at__gte=recent_date).order_by('-created_at')[:5]
        for course in recent_courses:
            activities.append({
                'id': f"course_{course.id}",
                'type': 'course_created',
                'title': 'Course created',
                'description': f'New course "{course.title}" was created',
                'timestamp': course.created_at.isoformat() if hasattr(course, 'created_at') and course.created_at else timezone.now().isoformat(),
                'icon': 'fas fa-book'
            })
        
        # Sort activities by timestamp (most recent first)
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Return only the 10 most recent activities
        return Response({'activities': activities[:10]})
        
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
def admin_settings(request):
    if request.session.get('role') == 'superadmin':
        user_role = 'superadmin'
    else:
        # Fallback to token authentication
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Token '):
            token_key = auth_header.split(' ')[1]
            try:
                token = Token.objects.get(key=token_key)
                if hasattr(token.user, 'profile') and token.user.profile.role == 'superadmin':
                    user_role = 'superadmin'
            except Token.DoesNotExist:
                pass
    
    if user_role != 'superadmin':
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)
    
    if request.method == 'GET':
        # Return default settings (in a real app, these would be stored in database)
        settings = {
            'maintenance_mode': False,
            'registration_enabled': True,
            'max_file_size': 10,  # MB
            'session_timeout': 30,  # minutes
            'email_notifications': True,
            'backup_frequency': 'daily'
        }
        return Response(settings)
    
    elif request.method == 'POST':
        try:
            # In a real application, you would save these to a Settings model
            data = request.data
            # For now, just return success
            return Response({"message": "Settings updated successfully"})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
