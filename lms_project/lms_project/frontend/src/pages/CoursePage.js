import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import sessionManager from "../sessionManager";
import config from "../config";
import "./CoursePage.css";

export default function CoursePage() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchCourseData();
    checkEnrollmentStatus();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        navigate('/login');
        return;
      }

      // Fetch course details
      const courseResponse = await fetch(`${config.API_BASE_URL}/courses/${courseId}/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData);
        
        // Fetch course modules
        const modulesResponse = await fetch(`${config.API_BASE_URL}/courses/${courseId}/modules/`, {
          credentials: 'include',
          headers: {
            'Authorization': `Token ${storedSession.token}`,
            'X-CSRFToken': sessionManager.getCSRFToken() || '',
          },
        });

        if (modulesResponse.ok) {
          const modulesData = await modulesResponse.json();
          setModules(modulesData.modules || []);
        }

        // Fetch assignments
        const assignmentsResponse = await fetch(`${config.API_BASE_URL}/courses/${courseId}/assignments/`, {
          credentials: 'include',
          headers: {
            'Authorization': `Token ${storedSession.token}`,
            'X-CSRFToken': sessionManager.getCSRFToken() || '',
          },
        });

        if (assignmentsResponse.ok) {
          const assignmentsData = await assignmentsResponse.json();
          setAssignments(assignmentsData.assignments || []);
        }
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) return;

      const response = await fetch(`${config.API_BASE_URL}/enrollment-status/${courseId}/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEnrollmentStatus(data.status || 'not-enrolled');
      }
    } catch (error) {
      console.error('Error checking enrollment status:', error);
    }
  };

  const handleEnroll = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        alert("Please log in to enroll in courses");
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/enroll/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        body: JSON.stringify({ course_id: parseInt(courseId) }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Successfully enrolled!');
        setEnrollmentStatus('enrolled');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Enrollment failed');
      }
    } catch (error) {
      console.error('Error enrolling:', error);
      alert('Network error. Please try again.');
    }
  };

  const markLessonComplete = (lessonId) => {
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#2196F3';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'programming': return 'fas fa-code';
      case 'web development': return 'fas fa-globe';
      case 'mobile development': return 'fas fa-mobile-alt';
      case 'data science': return 'fas fa-chart-bar';
      case 'cybersecurity': return 'fas fa-shield-alt';
      case 'cloud computing': return 'fas fa-cloud';
      case 'design': return 'fas fa-palette';
      case 'engineering': return 'fas fa-cogs';
      default: return 'fas fa-book';
    }
  };

  if (loading) {
    return (
      <div className="course-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-page">
        <div className="error-container">
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist.</p>
          <button onClick={() => navigate('/courses')} className="btn-primary">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-page">
      {/* Course Header */}
      <div className="course-header">
        <div className="course-header-content">
          <div className="course-image">
            <img 
              src={course.image || "/Images/flaceholder.png"} 
              alt={course.title}
              onError={(e) => {
                e.target.src = "/Images/flaceholder.png";
              }}
            />
          </div>
          <div className="course-info">
            <div className="course-meta">
              <span 
                className="difficulty-badge"
                style={{ backgroundColor: getDifficultyColor(course.difficulty) }}
              >
                {course.difficulty}
              </span>
              <span className="category-badge">
                <i className={getCategoryIcon(course.category)}></i>
                {course.category}
              </span>
              <span className="duration-badge">
                <i className="fas fa-clock"></i>
                {course.duration}
              </span>
            </div>
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
            <div className="course-instructor">
              <i className="fas fa-user"></i>
              <span>Instructor: {course.lecturer?.user?.first_name || 'TBA'} {course.lecturer?.user?.last_name || ''}</span>
            </div>
            {enrollmentStatus === 'not-enrolled' && (
              <button onClick={handleEnroll} className="enroll-btn">
                <i className="fas fa-plus"></i>
                Enroll Now
              </button>
            )}
            {enrollmentStatus === 'enrolled' && (
              <div className="enrolled-badge">
                <i className="fas fa-check"></i>
                Enrolled
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Navigation */}
      <div className="course-nav">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i>
          Overview
        </button>
        <button 
          className={activeTab === 'modules' ? 'active' : ''}
          onClick={() => setActiveTab('modules')}
        >
          <i className="fas fa-list"></i>
          Modules
        </button>
        <button 
          className={activeTab === 'assignments' ? 'active' : ''}
          onClick={() => setActiveTab('assignments')}
        >
          <i className="fas fa-tasks"></i>
          Assignments
        </button>
        <button 
          className={activeTab === 'discussion' ? 'active' : ''}
          onClick={() => setActiveTab('discussion')}
        >
          <i className="fas fa-comments"></i>
          Discussion
        </button>
      </div>

      {/* Course Content */}
      <div className="course-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="course-stats">
              <div className="stat-card">
                <i className="fas fa-play-circle"></i>
                <h3>{modules.length}</h3>
                <p>Modules</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-tasks"></i>
                <h3>{assignments.length}</h3>
                <p>Assignments</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-clock"></i>
                <h3>{course.duration}</h3>
                <p>Duration</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-signal"></i>
                <h3>{course.difficulty}</h3>
                <p>Level</p>
              </div>
            </div>

            <div className="course-details">
              <h3>What You'll Learn</h3>
              <ul className="learning-objectives">
                <li>Master the fundamentals of {course.category.toLowerCase()}</li>
                <li>Apply practical skills through hands-on projects</li>
                <li>Build a portfolio of work to showcase your abilities</li>
                <li>Connect with industry professionals and peers</li>
              </ul>

              <h3>Course Requirements</h3>
              <ul className="requirements">
                <li>Basic computer skills</li>
                <li>Internet connection for online materials</li>
                <li>Dedication to complete assignments on time</li>
                <li>Willingness to participate in discussions</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="modules-tab">
            <h3>Course Modules</h3>
            {modules.length > 0 ? (
              <div className="modules-list">
                {modules.map((module, index) => (
                  <div key={module.id} className="module-card">
                    <div className="module-header">
                      <span className="module-number">{index + 1}</span>
                      <h4>{module.title}</h4>
                      <span className="module-status">
                        {module.is_published ? (
                          <i className="fas fa-check-circle published"></i>
                        ) : (
                          <i className="fas fa-clock unpublished"></i>
                        )}
                      </span>
                    </div>
                    <p className="module-description">{module.description}</p>
                    {module.lessons && module.lessons.length > 0 && (
                      <div className="lessons-list">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="lesson-item">
                            <i className={`fas ${lesson.lesson_type === 'video' ? 'fa-play-circle' : 'fa-file-alt'}`}></i>
                            <span>{lesson.title}</span>
                            <span className="lesson-duration">{lesson.duration || '5 min'}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <i className="fas fa-book-open"></i>
                <p>No modules available yet. Check back soon!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-tab">
            <h3>Course Assignments</h3>
            {assignments.length > 0 ? (
              <div className="assignments-list">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="assignment-card">
                    <div className="assignment-header">
                      <h4>{assignment.title}</h4>
                      <span className="assignment-due">
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="assignment-description">{assignment.description}</p>
                    <div className="assignment-meta">
                      <span className="assignment-points">
                        <i className="fas fa-star"></i>
                        {assignment.max_points} points
                      </span>
                      <span className="assignment-status">
                        {assignment.is_published ? 'Published' : 'Draft'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <i className="fas fa-tasks"></i>
                <p>No assignments available yet. Check back soon!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'discussion' && (
          <div className="discussion-tab">
            <h3>Course Discussion</h3>
            <div className="no-content">
              <i className="fas fa-comments"></i>
              <p>Discussion forum coming soon!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
