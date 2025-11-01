import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import sessionManager from "../sessionManager";
import config from "../config";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Dashboard Statistics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLecturers: 0,
    totalStudents: 0,
    totalCourses: 0,
    totalAssignments: 0,
    totalEnrollments: 0,
    activeSessions: 0,
    systemHealth: 95
  });

  // User Management States
  const [users, setUsers] = useState([]);
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "student"
  });
  const [editingUser, setEditingUser] = useState(null);

  // Course Management States
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    duration: "",
    difficulty: "beginner",
    category: "",
    lecturer_id: "",
    image: ""
  });
  const [editingCourse, setEditingCourse] = useState(null);

  // Recent Activity States
  const [recentActivity, setRecentActivity] = useState([]);

  // Analytics States
  const [analytics, setAnalytics] = useState({
    userGrowth: [],
    coursePopularity: [],
    assignmentSubmissions: [],
    systemPerformance: []
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: 10,
    sessionTimeout: 30
  });

  // Check authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedSession = sessionManager.getStoredSession();
        console.log('🔍 AdminDashboard: Stored session:', storedSession);
        
        if (storedSession && storedSession.role === 'superadmin') {
          console.log('🔍 AdminDashboard: Using stored session data');
          setUserInfo({
            username: storedSession.username,
            role: storedSession.role,
            is_authenticated: true
          });
          fetchDashboardData();
          return;
        }

        const sessionInfo = await sessionManager.getSessionInfo();
        console.log('🔍 AdminDashboard: Server session info:', sessionInfo);

        if (sessionInfo.is_authenticated && sessionInfo.role === 'superadmin') {
          setUserInfo(sessionInfo);
    fetchDashboardData();
        } else {
          console.log('🔍 AdminDashboard: Authentication failed, redirecting to login');
          navigate("/login");
        }
      } catch (error) {
        console.error('🔍 AdminDashboard: Auth check error:', error);
        navigate("/login");
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch statistics
      await Promise.all([
        fetchStats(),
        fetchUsers(),
        fetchCourses(),
        fetchAnalytics(),
        fetchSystemSettings(),
        fetchRecentActivity()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) return;

      const response = await fetch(`${config.API_BASE_URL}/admin/recent-activity/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      } else {
        // Fallback to mock data if API fails
        setRecentActivity([
          {
            id: 1,
            type: 'user_registered',
            title: 'New user registered',
            description: 'A new student joined the platform',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            icon: 'fas fa-user-plus'
          },
          {
            id: 2,
            type: 'course_created',
            title: 'Course created',
            description: 'A new course was added to the platform',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            icon: 'fas fa-book'
          },
          {
            id: 3,
            type: 'assignment_submitted',
            title: 'Assignment submitted',
            description: 'Multiple assignments were submitted today',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            icon: 'fas fa-tasks'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Set fallback data
      setRecentActivity([
        {
          id: 1,
          type: 'user_registered',
          title: 'New user registered',
          description: 'A new student joined the platform',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-user-plus'
        },
        {
          id: 2,
          type: 'course_created',
          title: 'Course created',
          description: 'A new course was added to the platform',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-book'
        },
        {
          id: 3,
          type: 'assignment_submitted',
          title: 'Assignment submitted',
          description: 'Multiple assignments were submitted today',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          icon: 'fas fa-tasks'
        }
      ]);
    }
  };

  const fetchStats = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        showMessage('Please log in to access admin features', 'error');
        navigate('/login');
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/admin/stats/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Stats data received:', data);
        setStats({
          totalUsers: data.total_users || 0,
          totalLecturers: data.total_lecturers || 0,
          totalStudents: data.total_students || 0,
          totalCourses: data.total_courses || 0,
          totalAssignments: data.total_assignments || 0,
          totalEnrollments: data.total_enrollments || 0,
          activeSessions: data.active_sessions || 0,
          systemHealth: data.system_health || 95
        });
      } else {
        const errorData = await response.json();
        console.error('Error fetching stats:', errorData);
        showMessage(errorData.error || 'Failed to fetch statistics', 'error');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      showMessage('Network error while fetching statistics', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        showMessage('Please log in to access admin features', 'error');
        navigate('/login');
      return;
    }

      const response = await fetch(`${config.API_BASE_URL}/admin/users/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data received:', data);
        setUsers(data.users || []);
        updateStats('users', data.users?.length || 0);
      } else {
        const errorData = await response.json();
        console.error('Error fetching users:', errorData);
        showMessage(errorData.error || 'Failed to fetch users', 'error');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Network error while fetching users', 'error');
    }
  };

  const fetchCourses = async () => {
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) return;

      const response = await fetch(`${config.API_BASE_URL}/admin/courses/`, {
        credentials: 'include',
        headers: {
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });

      if (response.ok) {
      const data = await response.json();
        setCourses(data.courses || []);
        updateStats('courses', data.courses?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      // Mock data for development
      setCourses([
        { id: 1, title: 'Web Development', description: 'Learn modern web development', duration: '12 weeks', difficulty: 'intermediate', lecturer: 'Jane Smith', enrollments: 45 },
        { id: 2, title: 'Data Science', description: 'Introduction to data science', duration: '16 weeks', difficulty: 'advanced', lecturer: 'John Doe', enrollments: 32 },
        { id: 3, title: 'Mobile Development', description: 'React Native development', duration: '10 weeks', difficulty: 'beginner', lecturer: 'Alice Johnson', enrollments: 28 }
      ]);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics/', {
        credentials: 'include',
        headers: {
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock analytics data
      setAnalytics({
        userGrowth: [
          { month: 'Jan', users: 120 },
          { month: 'Feb', users: 145 },
          { month: 'Mar', users: 168 },
          { month: 'Apr', users: 192 }
        ],
        coursePopularity: [
          { course: 'Web Development', enrollments: 45 },
          { course: 'Data Science', enrollments: 32 },
          { course: 'Mobile Development', enrollments: 28 }
        ],
        assignmentSubmissions: [
          { date: '2025-01-15', submissions: 25 },
          { date: '2025-01-16', submissions: 32 },
          { date: '2025-01-17', submissions: 28 }
        ],
        systemPerformance: [
          { metric: 'CPU Usage', value: 45 },
          { metric: 'Memory Usage', value: 67 },
          { metric: 'Disk Usage', value: 23 }
        ]
      });
    }
  };

  const fetchSystemSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings/', {
        credentials: 'include',
          headers: {
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
          },
      });

      if (response.ok) {
        const data = await response.json();
        setSystemSettings(data);
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  };

  const updateStats = (type, value) => {
    setStats(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 5000);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        showMessage('Please log in to access admin features', 'error');
        navigate('/login');
      return;
    }

      const url = editingUser ? `${config.API_BASE_URL}/admin/users/${editingUser.id}/` : `${config.API_BASE_URL}/admin/users/`;
      const method = editingUser ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify(userForm),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchUsers();
        await fetchStats();
        setUserForm({ username: "", email: "", password: "", first_name: "", last_name: "", role: "student" });
        setEditingUser(null);
        showMessage(editingUser ? 'User updated successfully!' : 'User created successfully!', 'success');
      } else {
        const errorData = await response.json();
        console.error('User creation error:', errorData);
        showMessage(errorData.error || 'Error saving user', 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const storedSession = sessionManager.getStoredSession();
      if (!storedSession) {
        showMessage('Please log in to access admin features', 'error');
        navigate('/login');
        return;
      }

      const url = editingCourse ? `${config.API_BASE_URL}/admin/courses/${editingCourse.id}/` : `${config.API_BASE_URL}/admin/courses/`;
      const method = editingCourse ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${storedSession.token}`,
          'X-CSRFToken': sessionManager.getCSRFToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify(courseForm),
      });

      if (response.ok) {
        const data = await response.json();
        await fetchCourses();
        await fetchStats();
        setCourseForm({ title: "", description: "", duration: "", difficulty: "beginner", category: "", lecturer_id: "", image: "" });
        setEditingCourse(null);
        showMessage(editingCourse ? 'Course updated successfully!' : 'Course created successfully!', 'success');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Error saving course', 'error');
      }
    } catch (error) {
      console.error('Error saving course:', error);
      showMessage('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const storedSession = sessionManager.getStoredSession();
        if (!storedSession) {
          showMessage('Please log in to access admin features', 'error');
          navigate('/login');
          return;
        }

        const response = await fetch(`${config.API_BASE_URL}/admin/users/${userId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${storedSession.token}`,
            'X-CSRFToken': sessionManager.getCSRFToken() || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          await fetchUsers();
          await fetchStats();
          showMessage('User deleted successfully!', 'success');
        } else {
          const errorData = await response.json();
          showMessage(errorData.error || 'Error deleting user', 'error');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        showMessage('Network error. Please try again.', 'error');
      }
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const storedSession = sessionManager.getStoredSession();
        if (!storedSession) {
          showMessage('Please log in to access admin features', 'error');
          navigate('/login');
          return;
        }

        const response = await fetch(`${config.API_BASE_URL}/admin/courses/${courseId}/`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Token ${storedSession.token}`,
            'X-CSRFToken': sessionManager.getCSRFToken() || '',
          },
          credentials: 'include',
        });

        if (response.ok) {
          await fetchCourses();
          await fetchStats();
          showMessage('Course deleted successfully!', 'success');
        } else {
          const errorData = await response.json();
          showMessage(errorData.error || 'Error deleting course', 'error');
        }
      } catch (error) {
        console.error('Error deleting course:', error);
        showMessage('Network error. Please try again.', 'error');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await sessionManager.logout();
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      navigate("/login");
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!userInfo) {
    return null;
  }

  return (
    <div className="modern-admin-dashboard">
      {/* Message Display */}
      {message.text && (
        <div className={`message-alert ${message.type}`}>
          <i className={`fas fa-${message.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: "", type: "" })}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Header */}
      <header className="admin-header">
        <div className="header-container">
          <div className="header-left">
            <h1>Admin Dashboard</h1>
            <p>Welcome back, {userInfo.username}</p>
          </div>
          <div className="header-right">
            <div className="admin-actions">
              <button className="notification-btn">
                <i className="fas fa-bell"></i>
                <span className="notification-count">3</span>
              </button>
              <button className="settings-btn">
                <i className="fas fa-cog"></i>
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="admin-nav">
        <div className="nav-container">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-tachometer-alt"></i>
            <span>Overview</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users"></i>
            <span>Users</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <i className="fas fa-book"></i>
            <span>Courses</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-chart-bar"></i>
            <span>Analytics</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i>
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        <div className="main-container">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="overview-section">
              {/* Statistics Cards */}
              <div className="stats-section">
      <div className="stats-grid">
        <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-users"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalUsers}</h3>
                      <p>Total Users</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-chalkboard-teacher"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalLecturers}</h3>
                      <p>Lecturers</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-graduation-cap"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalStudents}</h3>
                      <p>Students</p>
                    </div>
        </div>
        <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-book"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalCourses}</h3>
                      <p>Courses</p>
                    </div>
        </div>
        <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-tasks"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalAssignments}</h3>
                      <p>Assignments</p>
                    </div>
        </div>
        <div className="stat-card">
                    <div className="stat-icon">
                      <i className="fas fa-user-plus"></i>
                    </div>
                    <div className="stat-content">
                      <h3>{stats.totalEnrollments}</h3>
                      <p>Enrollments</p>
                    </div>
                  </div>
        </div>
      </div>

              {/* Quick Actions */}
              <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                  <button className="action-card" onClick={() => setActiveTab('users')}>
                    <i className="fas fa-user-plus"></i>
                    <h3>Add User</h3>
                    <p>Create new user account</p>
                  </button>
                  <button className="action-card" onClick={() => setActiveTab('courses')}>
                    <i className="fas fa-book-plus"></i>
                    <h3>Add Course</h3>
                    <p>Create new course</p>
                  </button>
                  <button className="action-card">
                    <i className="fas fa-download"></i>
                    <h3>Export Data</h3>
                    <p>Download reports</p>
        </button>
                  <button className="action-card">
                    <i className="fas fa-cog"></i>
                    <h3>System Settings</h3>
                    <p>Configure system</p>
        </button>
                </div>
      </div>

              {/* Recent Activity */}
              <div className="recent-activity">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        <i className={activity.icon}></i>
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <span className="activity-time">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
        </div>
      )}

      {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="users-section">
              <div className="section-header">
                <h2>User Management</h2>
                <button className="primary-btn" onClick={() => setEditingUser(null)}>
                  <i className="fas fa-plus"></i>
                  Add User
                </button>
            </div>

              {/* User Form */}
              <div className="form-section">
                <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
                <form onSubmit={handleUserSubmit}>
                  <div className="form-grid">
            <div className="form-group">
                      <label>Username</label>
              <input
                type="text"
                value={userForm.username}
                onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
                      <label>Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                required
              />
            </div>
                    <div className="form-group">
                      <label>First Name</label>
                      <input
                        type="text"
                        value={userForm.first_name}
                        onChange={(e) => setUserForm({...userForm, first_name: e.target.value})}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input
                        type="text"
                        value={userForm.last_name}
                        onChange={(e) => setUserForm({...userForm, last_name: e.target.value})}
                        required
                      />
                    </div>
            <div className="form-group">
                      <label>Password</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                        required={!editingUser}
              />
            </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      >
                        <option value="student">Student</option>
                        <option value="lecturer">Lecturer</option>
                        <option value="superadmin">Super Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingUser ? 'Update User' : 'Create User'}
                    </button>
                    {editingUser && (
                      <button type="button" className="secondary-btn" onClick={() => setEditingUser(null)}>
                        Cancel
            </button>
                    )}
                  </div>
          </form>
              </div>

          {/* Users List */}
              <div className="table-section">
                <h3>All Users</h3>
            <div className="table-container">
                  <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                        <th>Name</th>
                    <th>Role</th>
                        <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                      {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                          <td>{user.first_name} {user.last_name}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                            <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="edit-btn"
                                onClick={() => {
                                  setEditingUser(user);
                                  setUserForm({
                                    username: user.username,
                                    email: user.email,
                                    password: '',
                                    first_name: user.first_name,
                                    last_name: user.last_name,
                                    role: user.role
                                  });
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                        <button
                          className="delete-btn"
                                onClick={() => handleDeleteUser(user.id)}
                        >
                                <i className="fas fa-trash"></i>
                        </button>
                            </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div className="courses-section">
              <div className="section-header">
                <h2>Course Management</h2>
                <button className="primary-btn" onClick={() => setEditingCourse(null)}>
                  <i className="fas fa-plus"></i>
                  Add Course
                </button>
              </div>

              {/* Course Form */}
              <div className="form-section">
                <h3>{editingCourse ? 'Edit Course' : 'Add New Course'}</h3>
                <form onSubmit={handleCourseSubmit}>
                  <div className="form-grid">
            <div className="form-group">
                      <label>Course Title</label>
              <input
                type="text"
                value={courseForm.title}
                onChange={(e) => setCourseForm({...courseForm, title: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
                      <label>Description</label>
              <textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({...courseForm, description: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
                      <label>Duration (weeks)</label>
              <input
                        type="number"
                value={courseForm.duration}
                onChange={(e) => setCourseForm({...courseForm, duration: e.target.value})}
                required
              />
            </div>
                    <div className="form-group">
                      <label>Difficulty</label>
                      <select
                        value={courseForm.difficulty}
                        onChange={(e) => setCourseForm({...courseForm, difficulty: e.target.value})}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
            <div className="form-group">
                      <label>Category</label>
              <input
                type="text"
                        value={courseForm.category}
                        onChange={(e) => setCourseForm({...courseForm, category: e.target.value})}
                        required
              />
            </div>
            <div className="form-group">
                      <label>Lecturer</label>
              <select
                value={courseForm.lecturer_id}
                onChange={(e) => setCourseForm({...courseForm, lecturer_id: e.target.value})}
                        required
              >
                        <option value="">Select Lecturer</option>
                        {users.filter(user => user.role === 'lecturer').map(lecturer => (
                  <option key={lecturer.id} value={lecturer.id}>
                            {lecturer.first_name} {lecturer.last_name}
                  </option>
                ))}
              </select>
            </div>
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="primary-btn">
                      {editingCourse ? 'Update Course' : 'Create Course'}
                    </button>
                    {editingCourse && (
                      <button type="button" className="secondary-btn" onClick={() => setEditingCourse(null)}>
                        Cancel
            </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Courses List */}
              <div className="table-section">
                <h3>All Courses</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Duration</th>
                        <th>Difficulty</th>
                        <th>Lecturer</th>
                        <th>Enrollments</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(course => (
                        <tr key={course.id}>
                          <td>{course.title}</td>
                          <td>{course.description}</td>
                          <td>{course.duration} weeks</td>
                          <td>
                            <span className={`difficulty-badge ${course.difficulty}`}>
                              {course.difficulty}
                            </span>
                          </td>
                          <td>{course.lecturer}</td>
                          <td>{course.enrollments}</td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="edit-btn"
                                onClick={() => {
                                  setEditingCourse(course);
                                  setCourseForm({
                                    title: course.title,
                                    description: course.description,
                                    duration: course.duration,
                                    difficulty: course.difficulty,
                                    category: course.category || '',
                                    lecturer_id: course.lecturer_id || '',
                                    image: course.image || ''
                                  });
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                    <button
                      className="delete-btn"
                                onClick={() => handleDeleteCourse(course.id)}
                    >
                                <i className="fas fa-trash"></i>
                    </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2>Analytics & Reports</h2>
              
              <div className="analytics-grid">
                <div className="chart-card">
                  <h3>User Growth</h3>
                  <div className="chart-container">
                    <div className="simple-chart">
                      {analytics.userGrowth.map((item, index) => (
                        <div key={index} className="chart-bar">
                          <div 
                            className="bar" 
                            style={{height: `${(item.users / 200) * 100}%`}}
                          ></div>
                          <span className="bar-label">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>Course Popularity</h3>
                  <div className="chart-container">
                    <div className="course-stats">
                      {analytics.coursePopularity.map((course, index) => (
                        <div key={index} className="course-stat">
                          <div className="course-name">{course.course}</div>
                          <div className="course-enrollments">{course.enrollments} enrollments</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="chart-card">
                  <h3>System Performance</h3>
                  <div className="chart-container">
                    <div className="performance-metrics">
                      {analytics.systemPerformance.map((metric, index) => (
                        <div key={index} className="metric">
                          <div className="metric-name">{metric.metric}</div>
                          <div className="metric-value">{metric.value}%</div>
                          <div className="metric-bar">
                            <div 
                              className="metric-fill" 
                              style={{width: `${metric.value}%`}}
                            ></div>
                  </div>
                </div>
              ))}
            </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="settings-section">
              <h2>System Settings</h2>
              
              <div className="settings-grid">
                <div className="setting-card">
                  <h3>General Settings</h3>
                  <div className="setting-item">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={systemSettings.maintenanceMode}
                        onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                      />
                      Maintenance Mode
                    </label>
                  </div>
                  <div className="setting-item">
                    <label>
                      <input 
                        type="checkbox" 
                        checked={systemSettings.registrationEnabled}
                        onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                      />
                      Enable Registration
                    </label>
                  </div>
                </div>

                <div className="setting-card">
                  <h3>File Upload Settings</h3>
                  <div className="setting-item">
                    <label>Max File Size (MB)</label>
                    <input 
                      type="number" 
                      value={systemSettings.maxFileSize}
                      onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="setting-card">
                  <h3>Session Settings</h3>
                  <div className="setting-item">
                    <label>Session Timeout (minutes)</label>
                    <input 
                      type="number" 
                      value={systemSettings.sessionTimeout}
                      onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="primary-btn">Save Settings</button>
                <button className="secondary-btn">Reset to Default</button>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;