import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import sessionManager from '../sessionManager';
import LogoutButton from '../components/LogoutButton';
import './IndustrialDashboard.css';

function IndustrialDashboard() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [recentActivity] = useState([]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const sessionInfo = await sessionManager.getSessionInfo();
        if (sessionInfo.is_authenticated) {
          setUserInfo(sessionInfo);
          await loadDashboardData();
        } else {
          navigate("/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Load user's courses
      const coursesResponse = await fetch('http://127.0.0.1:8000/api/my-courses/', {
        credentials: 'include',
      });
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData);
      } else {
        console.log("Courses endpoint response:", coursesResponse.status);
      }

      // Load notifications
      const notificationsResponse = await fetch('http://127.0.0.1:8000/api/simple-notifications/', {
        credentials: 'include',
      });
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData.slice(0, 5)); // Show only recent 5
      } else {
        console.log("Notifications endpoint response:", notificationsResponse.status);
        // Set empty notifications if endpoint fails
        setNotifications([]);
      }

      // Load analytics based on role
      if (userInfo?.role === 'student') {
        await loadStudentAnalytics();
      } else if (userInfo?.role === 'lecturer') {
        await loadLecturerAnalytics();
      } else if (userInfo?.role === 'superadmin') {
        await loadAdminAnalytics();
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      // Set default values on error
      setCourses([]);
      setNotifications([]);
    }
  };

  const loadStudentAnalytics = async () => {
    try {
      const analyticsData = {
        enrolledCourses: courses.length,
        completedCourses: courses.filter(c => c.status === 'completed').length,
        inProgressCourses: courses.filter(c => c.status === 'enrolled').length,
        averageProgress: courses.reduce((sum, c) => sum + (c.progress_percentage || 0), 0) / courses.length || 0,
        certificatesEarned: courses.filter(c => c.certificate_issued).length,
      };
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error loading student analytics:", error);
    }
  };

  const loadLecturerAnalytics = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/courses/', {
        credentials: 'include',
      });
      if (response.ok) {
        const coursesData = await response.json();
        const analyticsData = {
          totalCourses: coursesData.length,
          totalStudents: coursesData.reduce((sum, c) => sum + c.students_count, 0),
          averageEnrollment: coursesData.reduce((sum, c) => sum + c.students_count, 0) / coursesData.length || 0,
          publishedCourses: coursesData.filter(c => c.is_published).length,
        };
        setAnalytics(analyticsData);
      } else {
        console.log("Lecturer analytics endpoint response:", response.status);
        setAnalytics({});
      }
    } catch (error) {
      console.error("Error loading lecturer analytics:", error);
      setAnalytics({});
    }
  };

  const loadAdminAnalytics = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/admin-stats/', {
        credentials: 'include',
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setAnalytics(analyticsData);
      } else {
        console.log("Admin analytics endpoint response:", response.status);
        setAnalytics({});
      }
    } catch (error) {
      console.error("Error loading admin analytics:", error);
      setAnalytics({});
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      // For now, just mark as read locally since we don't have a working endpoint
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'student': return 'Student';
      case 'lecturer': return 'Lecturer';
      case 'superadmin': return 'Administrator';
      default: return 'User';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!userInfo) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="industrial-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-info">
            <h1>{getGreeting()}, {userInfo.username}!</h1>
            <p className="user-role">{getRoleTitle(userInfo.role)}</p>
          </div>
          <div className="header-actions">
            <div className="notifications-icon">
              <i className="fas fa-bell"></i>
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="notification-badge">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </div>
            <LogoutButton className="logout-btn">
              <i className="fas fa-sign-out-alt"></i> Logout
            </LogoutButton>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i> Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <i className="fas fa-book"></i> Courses
        </button>
        <button 
          className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <i className="fas fa-bell"></i> Notifications
        </button>
        <button 
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <i className="fas fa-chart-bar"></i> Analytics
        </button>
        {userInfo.role === 'superadmin' && (
          <button 
            className={`nav-tab ${activeTab === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <i className="fas fa-cog"></i> Admin
          </button>
        )}
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Quick Stats */}
            <div className="stats-grid">
              {userInfo.role === 'student' && (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.enrolledCourses || 0}</h3>
                      <p>Enrolled Courses</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.completedCourses || 0}</h3>
                      <p>Completed Courses</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-certificate"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.certificatesEarned || 0}</h3>
                      <p>Certificates Earned</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-percentage"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{Math.round(analytics.averageProgress || 0)}%</h3>
                      <p>Average Progress</p>
                    </div>
                  </div>
                </>
              )}
              
              {userInfo.role === 'lecturer' && (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalCourses || 0}</h3>
                      <p>Total Courses</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalStudents || 0}</h3>
                      <p>Total Students</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{Math.round(analytics.averageEnrollment || 0)}</h3>
                      <p>Avg Enrollment</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-eye"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.publishedCourses || 0}</h3>
                      <p>Published Courses</p>
                    </div>
                  </div>
                </>
              )}

              {userInfo.role === 'superadmin' && (
                <>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalUsers || 0}</h3>
                      <p>Total Users</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalLecturers || 0}</h3>
                      <p>Lecturers</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalStudents || 0}</h3>
                      <p>Students</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{analytics.totalCourses || 0}</h3>
                      <p>Total Courses</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        <i className="fas fa-circle"></i>
                      </div>
                      <div className="activity-content">
                        <p>{activity.description}</p>
                        <span className="activity-time">{activity.timestamp}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-activity">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="courses-tab">
            <div className="courses-header">
              <h2>My Courses</h2>
              <button className="btn btn-primary">
                <i className="fas fa-plus"></i> Browse Courses
              </button>
            </div>
            <div className="courses-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-image">
                    {course.image ? (
                      <img src={course.image} alt={course.title} />
                    ) : (
                      <div className="course-placeholder">
                        <i className="fas fa-book"></i>
                      </div>
                    )}
                  </div>
                  <div className="course-content">
                    <h3>{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                    <div className="course-meta">
                      <span className="course-duration">
                        <i className="fas fa-clock"></i> {course.duration}
                      </span>
                      <span className="course-status">
                        <i className="fas fa-circle"></i> {course.status}
                      </span>
                    </div>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${course.progress_percentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {Math.round(course.progress_percentage || 0)}% Complete
                      </span>
                    </div>
                    <div className="course-actions">
                      <button className="btn btn-primary">
                        <i className="fas fa-play"></i> Continue
                      </button>
                      {course.certificate_issued && (
                        <button className="btn btn-secondary">
                          <i className="fas fa-certificate"></i> Certificate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="notifications-tab">
            <div className="notifications-header">
              <h2>Notifications</h2>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  // For now, just mark as read locally
                  setNotifications(notifications.map(n => ({ ...n, is_read: true })));
                }}
              >
                Mark All Read
              </button>
            </div>
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.is_read ? 'unread' : ''}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="notification-icon">
                    <i className={`fas fa-${notification.notification_type === 'grade_posted' ? 'chart-line' : 'bell'}`}></i>
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {!notification.is_read && <div className="unread-indicator"></div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <h2>Analytics & Reports</h2>
            <div className="analytics-content">
              <div className="chart-placeholder">
                <i className="fas fa-chart-bar"></i>
                <p>Advanced analytics charts will be implemented here</p>
              </div>
            </div>
          </div>
        )}

        {/* Admin Tab */}
        {activeTab === 'admin' && userInfo.role === 'superadmin' && (
          <div className="admin-tab">
            <h2>Administration</h2>
            <div className="admin-actions">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/admin-dashboard')}
              >
                <i className="fas fa-cog"></i> Full Admin Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default IndustrialDashboard;
