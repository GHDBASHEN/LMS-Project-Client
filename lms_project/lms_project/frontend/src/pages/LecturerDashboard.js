import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api'; 
import LecturerCourseCard from '../components/LecturerCourseCard'; 
import sessionManager from '../sessionManager'; 
import './LecturerDashboard.css'; // 💡 Import the new CSS file

const LecturerDashboard = () => {
    // We'll also fetch/display stats for attractiveness
    const [stats, setStats] = useState({ 
        totalCourses: 0, 
        totalStudents: 0, 
        pendingAssignments: 0 
    });
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const username = sessionManager.getUsername() || 'Lecturer';
    
    // Function to fetch stats and courses
    useEffect(() => {
        const fetchDashboardData = async () => {
            
            if (!sessionManager.isLoggedIn()) {
                setError('Authentication token not found. Please log in.');
                setIsLoading(false);
                return;
            }

            try {
                // Fetch combined data from the lecturer dashboard view
                // NOTE: The endpoint /lecturer/dashboard/ provides all the data (stats, courses, notifications)
                // However, based on the previous error context, let's use the stable /lecturer/courses/ first.
                
                const coursesResponse = await api.get('/api/lecturer/courses/');
                setCourses(coursesResponse.data);

                // Assuming you have a /lecturer/dashboard/ or /lecturer/stats/ endpoint:
                // For now, use mock stats based on the course list data
                const totalCourses = coursesResponse.data.length;
                const totalStudents = coursesResponse.data.reduce((sum, course) => sum + (course.enrollment_count || 0), 0);
                
                setStats({
                    totalCourses: totalCourses,
                    // Note: totalStudents and pendingAssignments should ideally come from the backend's /lecturer/dashboard/ endpoint
                    totalStudents: totalStudents || 'N/A', 
                    pendingAssignments: 'N/A' 
                });

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err.response || err);
                
                let errorMessage = 'Failed to load dashboard data. Please check your network connection.';

                if (err.response) {
                    const status = err.response.status;
                    const data = err.response.data;
                    
                    if (status === 401) {
                        errorMessage = 'Session expired. Please log in again.';
                        sessionManager.logout(); 
                    } else if (status === 403) {
                        errorMessage = data.error || 'Access Denied (403). You are not authorized as a lecturer.';
                    } else if (status === 500) {
                        errorMessage = `Internal Server Error (500). Details: ${data.error || 'Check Django console for traceback.'}`;
                    } else {
                        errorMessage = `API Error (${status}): ${data.detail || data.error || 'Unknown server response.'}`;
                    }
                }
                
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);
    
    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="dashboard-container loading-state">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading your dashboard...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-container">
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error!</h4>
                    <p>{error}</p>
                    {error.includes('log in again') && (
                        <Link to="/login" className="btn btn-primary mt-2">Go to Login</Link>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="lecturer-dashboard-container">
            
            {/* Sidebar (For layout consistency) */}
            <aside className="dashboard-sidebar">
                <h3 className="sidebar-title">Dashboard Menu</h3>
                <ul className="sidebar-nav">
                    <li><Link to="/lecturer/courses" className="active"><i className="fas fa-book"></i> Courses</Link></li>
                    <li><Link to="/lecturer/assignments"><i className="fas fa-clipboard-list"></i> Assignments</Link></li>
                    <li><Link to="/profile"><i className="fas fa-user"></i> Profile</Link></li>
                    <li><Link to="/plagiarism-checker"><i className="fas fa-copy"></i> Plagiarism Check</Link></li>
                </ul>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main-content">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Welcome, {username}!</h1>
                    <p className="dashboard-subtitle">Manage your courses, students, and assignments.</p>
                </div>

                {/* Statistics Cards */}
                <div className="stats-row">
                    <div className="stat-card total-courses">
                        <i className="fas fa-graduation-cap icon"></i>
                        <div className="stat-info">
                            <p className="stat-label">Total Courses</p>
                            <h2 className="stat-value">{stats.totalCourses}</h2>
                        </div>
                    </div>
                    <div className="stat-card total-students">
                        <i className="fas fa-users icon"></i>
                        <div className="stat-info">
                            <p className="stat-label">Total Students</p>
                            <h2 className="stat-value">{stats.totalStudents}</h2>
                        </div>
                    </div>
                    <div className="stat-card pending-grading">
                        <i className="fas fa-hourglass-half icon"></i>
                        <div className="stat-info">
                            <p className="stat-label">Pending Grading</p>
                            <h2 className="stat-value">{stats.pendingAssignments}</h2>
                        </div>
                    </div>
                    <div className="stat-card quick-action">
                        <Link to="/create-course" className="btn-quick-action">
                            <i className="fas fa-plus"></i>
                            <p>Create New Course</p>
                        </Link>
                    </div>
                </div>
                
                <hr className="divider" />

                {/* Courses Section */}
                <h2 className="section-title">Your Assigned Courses ({courses.length})</h2>
                {courses.length > 0 ? (
                    <div className="courses-grid">
                        {courses.map(course => (
                            <LecturerCourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-info mt-4">
                        <p className="mb-0">You are not currently assigned to any courses. Use the quick action button to create one!</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default LecturerDashboard;