import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import config from "../../config";
import sessionManager from "../../sessionManager";
import "../CoursePage.css";

export default function VisualComputing() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const courseResponse = await axios.get(`${config.API_BASE_URL}/courses/${courseId}/`, {
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include'
      });

      setCourse(courseResponse.data);

      // Fetch modules
      const modulesResponse = await axios.get(`${config.API_BASE_URL}/courses/${courseId}/modules/`, {
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include'
      });

      setModules(modulesResponse.data.modules);

      // Fetch assignments
      const assignmentsResponse = await axios.get(`${config.API_BASE_URL}/courses/${courseId}/assignments/`, {
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include'
      });

      setAssignments(assignmentsResponse.data.assignments);

    } catch (error) {
      console.error('Error fetching course data:', error);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollmentStatus = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) return;

      const response = await axios.get(`${config.API_BASE_URL}/enrollment-status/${courseId}/`, {
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include'
      });

      setEnrollmentStatus(response.data.status);
    } catch (error) {
      console.error('Error checking enrollment:', error);
    }
  };

  const handleEnroll = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        alert("Please log in to enroll");
        navigate('/login');
        return;
      }

      const response = await axios.post(`${config.API_BASE_URL}/enroll/`, {
        course_id: courseId
      }, {
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include'
      });

      alert(response.data.message);
      setEnrollmentStatus('enrolled');
    } catch (error) {
      console.error('Enrollment error:', error);
      alert(error.response?.data?.detail || 'Enrollment failed');
    }
  };

  if (loading) {
    return (
      <div className="course-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Loading course...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-page">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h2>Error</h2>
          <p>{error}</p>
          <button className="btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-page">
        <div className="error-container">
          <i className="fas fa-book"></i>
          <h2>Course Not Found</h2>
          <p>The course you're looking for doesn't exist.</p>
          <button className="btn-primary" onClick={() => navigate('/courses')}>
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
            <img src={course.image || "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80"} alt={course.title} />
          </div>
          <div className="course-info">
            <h1>{course.title}</h1>
            <p className="course-description">{course.description}</p>
            
            <div className="course-meta">
              <span className={`difficulty-badge ${course.difficulty}`}>
                <i className="fas fa-signal"></i>
                {course.difficulty}
              </span>
              <span className="category-badge">
                <i className="fas fa-tag"></i>
                {course.category}
              </span>
              <span className="duration-badge">
                <i className="fas fa-clock"></i>
                {course.duration}
              </span>
            </div>

            {course.lecturer && (
              <div className="course-instructor">
                <i className="fas fa-user-tie"></i>
                <span>Instructor: {course.lecturer.user.first_name} {course.lecturer.user.last_name}</span>
              </div>
            )}

            {enrollmentStatus === 'not-enrolled' ? (
              <button className="enroll-btn" onClick={handleEnroll}>
                <i className="fas fa-plus"></i>
                Enroll Now
              </button>
            ) : (
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
      </div>

      {/* Course Content */}
      <div className="course-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            {/* Course Statistics */}
            <div className="course-stats">
              <div className="stat-card">
                <i className="fas fa-book"></i>
                <h3>{modules.length}</h3>
                <p>Modules</p>
              </div>
              <div className="stat-card">
                <i className="fas fa-play-circle"></i>
                <h3>{modules.reduce((total, module) => total + module.lessons.length, 0)}</h3>
                <p>Lessons</p>
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
            </div>

            {/* Course Details */}
            <div className="course-details">
              <h3>About This Course</h3>
              <p>{course.description}</p>
              
              <h3>Learning Objectives</h3>
              <ul className="learning-objectives">
                <li>Master computer vision, graphics, and visualization techniques</li>
                <li>Develop hands-on skills through real-world projects</li>
                <li>Understand industry best practices and standards</li>
                <li>Build a strong foundation for advanced learning</li>
                <li>Apply knowledge to solve complex problems</li>
              </ul>

              <h3>Course Requirements</h3>
              <ul className="requirements">
                <li>Basic understanding of computer science concepts</li>
                <li>Access to a computer with internet connection</li>
                <li>Willingness to practice and learn regularly</li>
                <li>Text editor or IDE (Visual Studio Code recommended)</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'modules' && (
          <div className="modules-section">
            <h3>Course Modules</h3>
            {modules.length > 0 ? (
              <div className="modules-list">
                {modules.map((module) => (
                  <div key={module.id} className="module-card">
                    <div className="module-header">
                      <div className="module-number">{module.order}</div>
                      <h4>{module.title}</h4>
                      <span className={`module-status ${module.is_published ? 'published' : 'unpublished'}`}>
                        <i className={`fas fa-${module.is_published ? 'check-circle' : 'clock'}`}></i>
                        {module.is_published ? 'Published' : 'Coming Soon'}
                      </span>
                    </div>
                    <p className="module-description">{module.description}</p>
                    
                    {module.lessons.length > 0 && (
                      <div className="lessons-list">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="lesson-item">
                            <i className={`fas fa-${lesson.lesson_type === 'video' ? 'play-circle' : lesson.lesson_type === 'assignment' ? 'tasks' : 'file-alt'}`}></i>
                            <span>{lesson.title}</span>
                            <span className="lesson-duration">{lesson.duration}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <i className="fas fa-book"></i>
                <p>No modules available yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <h3>Course Assignments</h3>
            {assignments.length > 0 ? (
              <div className="assignments-list">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="assignment-card">
                    <div className="assignment-header">
                      <h4>{assignment.title}</h4>
                      {assignment.due_date && (
                        <span className="assignment-due">
                          <i className="fas fa-calendar"></i>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="assignment-description">{assignment.description}</p>
                    <div className="assignment-meta">
                      <div className="assignment-points">
                        <i className="fas fa-star"></i>
                        {assignment.max_points} points
                      </div>
                      <span className="assignment-status">
                        <i className="fas fa-clock"></i>
                        Not Submitted
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-content">
                <i className="fas fa-tasks"></i>
                <p>No assignments available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
