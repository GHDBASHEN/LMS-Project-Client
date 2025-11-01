import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import sessionManager from "../sessionManager";
import LogoutButton from "../components/LogoutButton";
import PlagiarismChecker from "../components/PlagiarismChecker";
import "./StudentDashboard.css";

function StudentDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Dashboard data states
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    averageGrade: 0,
    totalAssignments: 0,
    pendingAssignments: 0
  });
  const [showPlagiarismChecker, setShowPlagiarismChecker] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedSession = sessionManager.getStoredSession();
        
        if (storedSession && storedSession.role === 'student') {
          setUserInfo({
            username: storedSession.username,
            role: storedSession.role,
            is_authenticated: true
          });
          await loadDashboardData();
          return;
        }
        
        const sessionInfo = await sessionManager.getSessionInfo();
        
        if (sessionInfo.is_authenticated) {
          setUserInfo(sessionInfo);
          await loadDashboardData();
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error('Auth check error:', error);
    navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Load modern mock data
      setEnrolledCourses([
        {
          id: 1,
          title: "Advanced Programming",
          instructor: "Dr. Sarah Johnson",
          progress: 78,
          nextLesson: "React Hooks & State Management",
          dueDate: "2025-01-20",
          image: "/Images/co1.jpeg",
          category: "Programming",
          duration: "12 weeks",
          rating: 4.8
        },
        {
          id: 2,
          title: "Data Science Fundamentals",
          instructor: "Prof. Michael Chen",
          progress: 45,
          nextLesson: "Machine Learning Basics",
          dueDate: "2025-01-25",
          image: "/Images/co2.png",
          category: "Data Science",
          duration: "16 weeks",
          rating: 4.9
        },
        {
          id: 3,
          title: "Web Development Mastery",
          instructor: "Ms. Emily Rodriguez",
          progress: 92,
          nextLesson: "Advanced CSS Techniques",
          dueDate: "2025-01-18",
          image: "/Images/co3.jpeg",
          category: "Web Development",
          duration: "10 weeks",
          rating: 4.7
        },
        {
          id: 4,
          title: "Mobile App Development",
          instructor: "Dr. James Wilson",
          progress: 23,
          nextLesson: "React Native Setup",
          dueDate: "2025-01-30",
          image: "/Images/co4.jpeg",
          category: "Mobile Development",
          duration: "14 weeks",
          rating: 4.6
        }
      ]);

      setAssignments([
        {
          id: 1,
          title: "Build a Full-Stack Todo App",
          course: "Web Development Mastery",
          dueDate: "2025-01-20",
          status: "pending",
          points: 100,
          difficulty: "Medium",
          estimatedTime: "4 hours"
        },
        {
          id: 2,
          title: "Implement Binary Search Algorithm",
          course: "Advanced Programming",
          dueDate: "2025-01-18",
          status: "submitted",
          points: 85,
          difficulty: "Easy",
          estimatedTime: "2 hours"
        },
        {
          id: 3,
          title: "Data Visualization Project",
          course: "Data Science Fundamentals",
          dueDate: "2025-01-22",
          status: "pending",
          points: 120,
          difficulty: "Hard",
          estimatedTime: "6 hours"
        },
        {
          id: 4,
          title: "React Native Navigation Setup",
          course: "Mobile App Development",
          dueDate: "2025-01-25",
          status: "pending",
          points: 90,
          difficulty: "Medium",
          estimatedTime: "3 hours"
        }
      ]);

      setGrades([
        { course: "Advanced Programming", grade: "A", points: 92, totalPoints: 100 },
        { course: "Data Science Fundamentals", grade: "B+", points: 87, totalPoints: 100 },
        { course: "Web Development Mastery", grade: "A-", points: 89, totalPoints: 100 },
        { course: "Mobile App Development", grade: "B", points: 82, totalPoints: 100 }
      ]);

      setNotifications([
        {
          id: 1,
          title: "New Assignment Posted",
          message: "Full-Stack Todo App assignment is now available",
          time: "2 hours ago",
          type: "assignment",
          read: false
        },
        {
          id: 2,
          title: "Grade Posted",
          message: "Your Binary Search assignment has been graded",
          time: "1 day ago",
          type: "grade",
          read: true
        },
        {
          id: 3,
          title: "Course Update",
          message: "New lesson added to Web Development course",
          time: "2 days ago",
          type: "course",
          read: false
        }
      ]);

      setUpcomingEvents([
        {
          id: 1,
          title: "Live Coding Session",
          course: "Advanced Programming",
          date: "2025-01-19",
          time: "2:00 PM",
          type: "live"
        },
        {
          id: 2,
          title: "Assignment Due",
          course: "Web Development Mastery",
          date: "2025-01-20",
          time: "11:59 PM",
          type: "deadline"
        },
        {
          id: 3,
          title: "Quiz Available",
          course: "Data Science Fundamentals",
          date: "2025-01-21",
          time: "9:00 AM",
          type: "quiz"
        }
      ]);

      setStats({
        totalCourses: 4,
        completedCourses: 0,
        averageGrade: 87.5,
        totalAssignments: 4,
        pendingAssignments: 3
      });

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  const handleAssignmentClick = (assignmentId) => {
    console.log('Navigate to assignment:', assignmentId);
  };

  const handleCheckPlagiarism = () => {
    setShowPlagiarismChecker(true);
  };

  const handlePlagiarismResult = (result) => {
    alert(`Plagiarism check completed! Similarity: ${result.plagiarism_score || result.report?.percent || 0}%`);
  };

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading your dashboard...</h3>
          <p>Please wait while we prepare your learning environment</p>
        </div>
      </div>
    );
  }

  if (!userInfo) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="modern-student-dashboard">
      {/* Modern Header */}
      <header className="dashboard-header">
        <div className="header-container">
          <div className="header-left">
            <div className="user-greeting">
              <h1>Welcome back, {userInfo.username}!</h1>
              <p>Ready to continue your learning journey?</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-actions">
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setShowPlagiarismChecker(true);
                }}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-search"></i>
                Test Plagiarism Checker
              </button>
              <button className="notification-btn">
                <i className="fas fa-bell"></i>
                <span className="notification-count">{notifications.filter(n => !n.read).length}</span>
              </button>
              <div className="user-profile">
                <div className="profile-avatar">
                  <i className="fas fa-user"></i>
                </div>
                <div className="profile-info">
                  <span className="profile-name">{userInfo.username}</span>
                  <span className="profile-role">Student</span>
                </div>
              </div>
              <LogoutButton className="logout-btn">
                <i className="fas fa-sign-out-alt"></i>
              </LogoutButton>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Navigation */}
      <nav className="dashboard-nav">
        <div className="nav-container">
          <button 
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-home"></i>
            <span>Overview</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fas fa-book"></i>
            <span>My Courses</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
            onClick={() => setActiveTab('assignments')}
          >
            <i className="fas fa-tasks"></i>
            <span>Assignments</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
          >
            <i className="fas fa-chart-line"></i>
            <span>Grades</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <i className="fas fa-calendar"></i>
            <span>Calendar</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="dashboard-main">
        <div className="main-container">
          {activeTab === 'overview' && (
            <div className="overview-section">
              {/* Stats Cards */}
              <div className="stats-section">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-book-open"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalCourses}</h3>
                      <p>Active Courses</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.completedCourses}</h3>
                      <p>Completed</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-star"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.averageGrade}%</h3>
                      <p>Average Grade</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.pendingAssignments}</h3>
                      <p>Pending Tasks</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Grid */}
              <div className="content-grid">
                {/* Recent Courses */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Recent Courses</h3>
                    <button className="view-all-btn">View All</button>
                  </div>
                  <div className="courses-preview">
                    {enrolledCourses.slice(0, 3).map(course => (
                      <div key={course.id} className="course-preview-card" onClick={() => handleCourseClick(course.id)}>
                        <div className="course-image">
                          <img src={course.image} alt={course.title} />
                          <div className="course-overlay">
                            <div className="progress-circle">
                              <svg className="progress-ring" width="40" height="40">
                                <circle
                                  className="progress-ring-circle"
                                  stroke="#4CAF50"
                                  strokeWidth="3"
                                  fill="transparent"
                                  r="18"
                                  cx="20"
                                  cy="20"
                                  style={{
                                    strokeDasharray: `${2 * Math.PI * 18}`,
                                    strokeDashoffset: `${2 * Math.PI * 18 * (1 - course.progress / 100)}`
                                  }}
                                />
                              </svg>
                              <span className="progress-text">{course.progress}%</span>
                            </div>
                          </div>
                        </div>
                        <div className="course-info">
                          <h4>{course.title}</h4>
                          <p className="instructor">{course.instructor}</p>
                          <div className="course-meta">
                            <span className="category">{course.category}</span>
                            <span className="rating">
                              <i className="fas fa-star"></i>
                              {course.rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Assignments */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Upcoming Assignments</h3>
                    <button className="view-all-btn">View All</button>
                  </div>
                  <div className="assignments-preview">
                    {assignments.filter(a => a.status === 'pending').slice(0, 3).map(assignment => (
                      <div key={assignment.id} className="assignment-preview-card" onClick={() => handleAssignmentClick(assignment.id)}>
                        <div className="assignment-header">
                          <div className="assignment-icon">
                            <i className="fas fa-file-alt"></i>
                          </div>
                          <div className="assignment-info">
                            <h4>{assignment.title}</h4>
                            <p className="course-name">{assignment.course}</p>
                            <div className="assignment-meta">
                              <span className="due-date">{assignment.dueDate}</span>
                              <span className={`difficulty ${assignment.difficulty.toLowerCase()}`}>{assignment.difficulty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="assignment-points">
                          {assignment.points} pts
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Recent Notifications</h3>
                    <button className="view-all-btn">View All</button>
                  </div>
                  <div className="notifications-preview">
                    {notifications.slice(0, 4).map(notification => (
                      <div key={notification.id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                        <div className="notification-content-wrapper">
                          <div className={`notification-icon ${notification.type}`}>
                            <i className={`fas fa-${notification.type === 'assignment' ? 'file-alt' : notification.type === 'grade' ? 'chart-line' : notification.type === 'live' ? 'video' : 'book'}`}></i>
                          </div>
                          <div className="notification-content">
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <span className="notification-time">{notification.time}</span>
                          </div>
                        </div>
                        {!notification.read && <div className="unread-indicator"></div>}
                        <div className={`notification-type-badge ${notification.type}`}>
                          {notification.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="content-card">
                  <div className="card-header">
                    <h3>Upcoming Events</h3>
                    <button className="view-all-btn">View Calendar</button>
                  </div>
                  <div className="events-preview">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="event-item">
                        <div className="event-date">
                          <span className="day">{new Date(event.date).getDate()}</span>
                          <span className="month">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                        </div>
                        <div className="event-info">
                          <h4>{event.title}</h4>
                          <p className="course-name">{event.course}</p>
                          <span className="event-time">{event.time}</span>
                        </div>
                        <div className={`event-type ${event.type}`}>
                          <i className={`fas fa-${event.type === 'live' ? 'video' : event.type === 'deadline' ? 'clock' : 'question-circle'}`}></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="courses-section">
              <div className="section-header">
                <h2>My Courses</h2>
                <button className="primary-btn">
                  <i className="fas fa-plus"></i>
                  Browse Courses
                </button>
              </div>
              <div className="courses-grid">
                {enrolledCourses.map(course => (
                  <div key={course.id} className="course-card" onClick={() => handleCourseClick(course.id)}>
                    <div className="course-image">
                      <img src={course.image} alt={course.title} />
                      <div className="course-overlay">
                        <button className="continue-btn">Continue Learning</button>
                      </div>
                    </div>
                    <div className="course-content">
                      <div className="course-header">
                        <h3>{course.title}</h3>
                        <span className="course-rating">
                          <i className="fas fa-star"></i>
                          {course.rating}
                        </span>
                      </div>
                      <p className="instructor">by {course.instructor}</p>
                      <div className="course-progress">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${course.progress}%` }}></div>
                        </div>
                        <span className="progress-text">{course.progress}% Complete</span>
                      </div>
                      <div className="course-meta">
                        <span className="category">{course.category}</span>
                        <span className="duration">{course.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="assignments-section">
              <div className="section-header">
                <h2>Assignments</h2>
                <div className="filter-tabs">
                  <button className="filter-tab active">All</button>
                  <button className="filter-tab">Pending</button>
                  <button className="filter-tab">Submitted</button>
                </div>
              </div>
              <div className="assignments-grid">
                {assignments.length > 0 ? (
                  assignments.map(assignment => (
                    <div key={assignment.id} className="assignment-card" onClick={() => handleAssignmentClick(assignment.id)}>
                      <div className="assignment-header">
                        <h3>{assignment.title}</h3>
                        <span className={`status-badge ${assignment.status}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <div className="assignment-meta">
                        <p className="course-name">{assignment.course}</p>
                        <div className="assignment-details">
                          <span className="due-date">
                            <i className="fas fa-calendar"></i>
                            Due: {assignment.dueDate}
                          </span>
                          <span className="difficulty">
                            <i className="fas fa-signal"></i>
                            {assignment.difficulty}
                          </span>
                          <span className="time-estimate">
                            <i className="fas fa-clock"></i>
                            {assignment.estimatedTime}
                          </span>
                        </div>
                      </div>
                      <div className="assignment-footer">
                        <span className="points">{assignment.points} points</span>
                        <div className="assignment-actions">
                          {assignment.status === 'pending' ? (
                            <button className="start-btn">Start Assignment</button>
                          ) : (
                            <button className="view-btn">View Submission</button>
                          )}
                          <button 
                            className="plagiarism-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckPlagiarism();
                            }}
                          >
                            <i className="fas fa-search"></i>
                            Check Plagiarism
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="sample-assignments">
                    <h3>Sample Assignments (for testing)</h3>
                    <div className="assignment-card">
                      <div className="assignment-header">
                        <h3>Sample Assignment 1</h3>
                        <span className="status-badge pending">pending</span>
                      </div>
                      <div className="assignment-meta">
                        <p className="course-name">Programming Course</p>
                        <div className="assignment-details">
                          <span className="due-date">
                            <i className="fas fa-calendar"></i>
                            Due: Dec 31, 2025
                          </span>
                          <span className="difficulty">
                            <i className="fas fa-signal"></i>
                            Medium
                          </span>
                          <span className="time-estimate">
                            <i className="fas fa-clock"></i>
                            2 hours
                          </span>
                        </div>
                      </div>
                      <div className="assignment-footer">
                        <span className="points">100 points</span>
                        <div className="assignment-actions">
                          <button className="start-btn">Start Assignment</button>
                          <button 
                            className="plagiarism-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckPlagiarism();
                            }}
                          >
                            <i className="fas fa-search"></i>
                            Check Plagiarism
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="assignment-card">
                      <div className="assignment-header">
                        <h3>Sample Assignment 2</h3>
                        <span className="status-badge submitted">submitted</span>
                      </div>
                      <div className="assignment-meta">
                        <p className="course-name">Web Development</p>
                        <div className="assignment-details">
                          <span className="due-date">
                            <i className="fas fa-calendar"></i>
                            Due: Jan 15, 2026
                          </span>
                          <span className="difficulty">
                            <i className="fas fa-signal"></i>
                            Easy
                          </span>
                          <span className="time-estimate">
                            <i className="fas fa-clock"></i>
                            1 hour
                          </span>
                        </div>
                      </div>
                      <div className="assignment-footer">
                        <span className="points">85 points</span>
                        <div className="assignment-actions">
                          <button className="view-btn">View Submission</button>
                          <button 
                            className="plagiarism-btn" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckPlagiarism();
                            }}
                          >
                            <i className="fas fa-search"></i>
                            Check Plagiarism
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'grades' && (
            <div className="grades-section">
              <div className="section-header">
                <h2>Grades & Progress</h2>
              </div>
              <div className="grades-overview">
                <div className="grade-summary">
                  <h3>Overall Performance</h3>
                  <div className="grade-stats">
                    <div className="grade-stat">
                      <span className="stat-value">{stats.averageGrade}%</span>
                      <span className="stat-label">Average Grade</span>
                    </div>
                    <div className="grade-stat">
                      <span className="stat-value">{stats.totalCourses}</span>
                      <span className="stat-label">Courses Enrolled</span>
                    </div>
                    <div className="grade-stat">
                      <span className="stat-value">{stats.completedCourses}</span>
                      <span className="stat-label">Courses Completed</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grades-list">
                {grades.map((grade, index) => (
                  <div key={index} className="grade-item">
                    <div className="grade-course">
                      <h4>{grade.course}</h4>
                      <p>Final Grade</p>
                    </div>
                    <div className="grade-score">
                      <span className="grade-letter">{grade.grade}</span>
                      <span className="grade-percentage">{grade.points}/{grade.totalPoints}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="calendar-section">
              <div className="section-header">
                <h2>Calendar</h2>
                <div className="calendar-controls">
                  <button className="control-btn">Today</button>
                  <button className="control-btn">Week</button>
                  <button className="control-btn">Month</button>
                </div>
              </div>
              <div className="calendar-content">
                <div className="upcoming-events">
                  <h3>Upcoming Events</h3>
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="calendar-event">
                      <div className="event-date">
                        <span className="day">{new Date(event.date).getDate()}</span>
                        <span className="month">{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="event-details">
                        <h4>{event.title}</h4>
                        <p>{event.course}</p>
                        <span className="event-time">{event.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Plagiarism Checker Modal */}
      {showPlagiarismChecker && (
        <PlagiarismChecker
          onResult={handlePlagiarismResult}
          onClose={() => setShowPlagiarismChecker(false)}
        />
      )}
    </div>
  );
}

export default StudentDashboard;