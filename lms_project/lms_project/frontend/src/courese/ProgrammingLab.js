import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProgrammingLab.css";

export default function ProgrammingLab() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedModule, setSelectedModule] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const course = {
    id: 1,
    title: "Programming Laboratory",
    code: "CS101",
    instructor: "Dr. Sarah Johnson",
    duration: "15 Weeks",
    level: "Beginner",
    rating: 4.8,
    students: 1247,
    progress: 65,
    description: "Hands-on programming course covering fundamental concepts through practical exercises and projects.",
    objectives: [
      "Master programming fundamentals",
      "Develop problem-solving skills",
      "Learn debugging techniques",
      "Build real-world projects",
      "Collaborate with peers"
    ]
  };

  const modules = [
    {
      id: 1,
      title: "Introduction to Programming",
      duration: "2 weeks",
      lessons: 5,
      completed: true,
      lessonsList: [
        { id: 1, title: "Setting up Development Environment", duration: "30 min", type: "video", completed: true },
        { id: 2, title: "Basic Syntax and Variables", duration: "45 min", type: "reading", completed: true },
        { id: 3, title: "Data Types and Operators", duration: "1 hour", type: "video", completed: true },
        { id: 4, title: "Your First Program", duration: "1.5 hours", type: "assignment", completed: true },
        { id: 5, title: "Debugging Basics", duration: "45 min", type: "quiz", completed: true }
      ]
    },
    {
      id: 2,
      title: "Control Structures",
      duration: "3 weeks",
      lessons: 6,
      completed: true,
      lessonsList: [
        { id: 6, title: "Conditional Statements", duration: "1 hour", type: "video", completed: true },
        { id: 7, title: "Loops and Iteration", duration: "1.5 hours", type: "video", completed: true },
        { id: 8, title: "Switch Statements", duration: "45 min", type: "reading", completed: true },
        { id: 9, title: "Practice: Number Guessing Game", duration: "2 hours", type: "assignment", completed: true },
        { id: 10, title: "Code Review Session", duration: "1 hour", type: "live", completed: true },
        { id: 11, title: "Control Structures Quiz", duration: "30 min", type: "quiz", completed: true }
      ]
    },
    {
      id: 3,
      title: "Functions and Modules",
      duration: "2 weeks",
      lessons: 5,
      completed: false,
      current: true,
      lessonsList: [
        { id: 12, title: "Function Declaration and Expression", duration: "1 hour", type: "video", completed: true },
        { id: 13, title: "Parameters and Return Values", duration: "45 min", type: "video", completed: true },
        { id: 14, title: "Scope and Closures", duration: "1.5 hours", type: "reading", completed: false },
        { id: 15, title: "Building a Calculator", duration: "2 hours", type: "assignment", completed: false },
        { id: 16, title: "Module Systems", duration: "1 hour", type: "video", completed: false }
      ]
    }
  ];

  useEffect(() => {
    checkEnrollmentStatus();
  }, []);

  const checkEnrollmentStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/enrollment-status/${course.id}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      setEnrollmentStatus(response.data.status);
    } catch (error) {
      console.error("Error checking enrollment:", error);
      setEnrollmentStatus("not-enrolled");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!token) {
      alert("Please login to enroll in this course");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/enroll/", {
        course_id: course.id
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      setEnrollmentStatus("enrolled");
      alert("Successfully enrolled in the course!");
    } catch (error) {
      console.error("Enrollment error:", error);
      alert(error.response?.data?.detail || "Enrollment failed");
    }
  };

  const toggleLessonComplete = (lessonId) => {
    if (enrollmentStatus !== "enrolled") {
      alert("Please enroll in the course to track progress");
      return;
    }
    setCompletedLessons(prev => 
      prev.includes(lessonId) 
        ? prev.filter(id => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const getLessonTypeIcon = (type) => {
    const icons = {
      video: "🎥",
      reading: "📖",
      assignment: "📝",
      quiz: "📋",
      live: "🔴",
      submission: "📤"
    };
    return icons[type] || "📄";
  };

  if (loading) {
    return <div className="loading">Loading course...</div>;
  }

  return (
    <div className="programming-lab">
      {/* Course Header */}
      <div className="course-header">
        <div className="course-banner">
          <div className="course-info">
            <h1 className="course-title">{course.title}</h1>
            <p className="course-code">{course.code}</p>
            <div className="course-meta">
              <span className="instructor">Instructor: {course.instructor}</span>
              <span className="duration">Duration: {course.duration}</span>
              <span className="level">Level: {course.level}</span>
            </div>
            <div className="course-stats">
              <div className="stat">
                <span className="stat-value">{course.rating}</span>
                <span className="stat-label">Rating</span>
              </div>
              <div className="stat">
                <span className="stat-value">{course.students}</span>
                <span className="stat-label">Students</span>
              </div>
              <div className="stat">
                <span className="stat-value">{course.progress}%</span>
                <span className="stat-label">Progress</span>
              </div>
            </div>
          </div>
          
          <div className="enrollment-section">
            {enrollmentStatus === "not-enrolled" ? (
              <button className="enroll-btn-large" onClick={handleEnroll}>
                Enroll Now
              </button>
            ) : (
              <div className="enrollment-status">
                <span className="status-badge enrolled">✅ Enrolled</span>
                <button className="continue-btn">Continue Learning</button>
              </div>
            )}
            <div className="course-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${course.progress}%` }}
                ></div>
              </div>
              <span className="progress-text">{course.progress}% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="course-tabs">
        <button 
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📚 Overview
        </button>
        <button 
          className={`tab ${activeTab === "content" ? "active" : ""}`}
          onClick={() => setActiveTab("content")}
        >
          📖 Course Content
        </button>
        <button 
          className={`tab ${activeTab === "assignments" ? "active" : ""}`}
          onClick={() => setActiveTab("assignments")}
        >
          📝 Assignments
        </button>
        <button 
          className={`tab ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setActiveTab("resources")}
        >
          📚 Resources
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="course-description">
                <h2>Course Description</h2>
                <p>{course.description}</p>
                
                <h3>Learning Objectives</h3>
                <ul className="objectives-list">
                  {course.objectives.map((objective, index) => (
                    <li key={index}>✅ {objective}</li>
                  ))}
                </ul>

                <h3>Prerequisites</h3>
                <ul className="prerequisites-list">
                  <li>Basic computer literacy</li>
                  <li>No prior programming experience required</li>
                  <li>Willingness to learn and practice</li>
                </ul>
              </div>
              
              <div className="course-sidebar">
                <div className="instructor-card">
                  <h3>About Instructor</h3>
                  <div className="instructor-info">
                    <div className="instructor-avatar">SJ</div>
                    <div className="instructor-details">
                      <h4>{course.instructor}</h4>
                      <p>Professor of Computer Science</p>
                      <p>PhD in Computer Engineering</p>
                      <div className="instructor-stats">
                        <span>15+ years experience</span>
                        <span>10,000+ students</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="course-features">
                  <h3>Course Features</h3>
                  <div className="features-list">
                    <div className="feature">
                      <span className="feature-icon">🎥</span>
                      <span>20+ Hours Video</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">📝</span>
                      <span>15 Assignments</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">📋</span>
                      <span>5 Quizzes</span>
                    </div>
                    <div className="feature">
                      <span className="feature-icon">🏆</span>
                      <span>Certificate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "content" && (
          <div className="content-tab">
            {enrollmentStatus !== "enrolled" ? (
              <div className="enrollment-prompt">
                <h3>Enroll to Access Course Content</h3>
                <p>Please enroll in this course to access all lessons, assignments, and materials.</p>
                <button className="enroll-btn" onClick={handleEnroll}>
                  Enroll Now
                </button>
              </div>
            ) : (
              <div className="modules-list">
                <h2>Course Content</h2>
                {modules.map(module => (
                  <div 
                    key={module.id} 
                    className={`module-card ${module.current ? "current" : ""} ${module.completed ? "completed" : ""}`}
                  >
                    <div className="module-header">
                      <div className="module-info">
                        <h3>{module.title}</h3>
                        <div className="module-meta">
                          <span>📅 {module.duration}</span>
                          <span>📚 {module.lessons} lessons</span>
                          {module.completed && <span className="completed-badge">Completed</span>}
                          {module.current && <span className="current-badge">Current</span>}
                        </div>
                      </div>
                      <button 
                        className="toggle-lessons"
                        onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                      >
                        {selectedModule === module.id ? "▲" : "▼"}
                      </button>
                    </div>
                    
                    {selectedModule === module.id && (
                      <div className="lessons-list">
                        {module.lessonsList.map(lesson => (
                          <div 
                            key={lesson.id} 
                            className={`lesson-item ${lesson.completed ? "completed" : ""}`}
                          >
                            <div className="lesson-info">
                              <span className="lesson-type">
                                {getLessonTypeIcon(lesson.type)}
                              </span>
                              <div className="lesson-details">
                                <h4>{lesson.title}</h4>
                                <span className="lesson-duration">{lesson.duration}</span>
                              </div>
                            </div>
                            <div className="lesson-actions">
                              <button 
                                className={`complete-btn ${lesson.completed ? "completed" : ""}`}
                                onClick={() => toggleLessonComplete(lesson.id)}
                              >
                                {lesson.completed ? "✓ Completed" : "Mark Complete"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "assignments" && (
          <div className="assignments-tab">
            {enrollmentStatus !== "enrolled" ? (
              <div className="enrollment-prompt">
                <h3>Enroll to View Assignments</h3>
                <p>Please enroll in this course to access assignments and submit your work.</p>
                <button className="enroll-btn" onClick={handleEnroll}>
                  Enroll Now
                </button>
              </div>
            ) : (
              <>
                <h2>Assignments</h2>
                <div className="assignments-list">
                  <div className="assignment-card">
                    <div className="assignment-header">
                      <h3>Number Guessing Game</h3>
                      <span className="status submitted">Submitted</span>
                    </div>
                    <p className="assignment-description">
                      Create a number guessing game using control structures and basic input/output.
                    </p>
                    <div className="assignment-meta">
                      <span>Due: 2024-02-15</span>
                      <span>Grade: A</span>
                    </div>
                    <div className="assignment-actions">
                      <button className="view-btn">View Assignment</button>
                      <button className="submit-btn">Resubmit</button>
                    </div>
                  </div>

                  <div className="assignment-card">
                    <div className="assignment-header">
                      <h3>Calculator Application</h3>
                      <span className="status in-progress">In Progress</span>
                    </div>
                    <p className="assignment-description">
                      Build a calculator application using functions and modules.
                    </p>
                    <div className="assignment-meta">
                      <span>Due: 2024-02-28</span>
                      <span>Grade: -</span>
                    </div>
                    <div className="assignment-actions">
                      <button className="view-btn">Continue Working</button>
                      <button className="submit-btn">Submit Work</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "resources" && (
          <div className="resources-tab">
            {enrollmentStatus !== "enrolled" ? (
              <div className="enrollment-prompt">
                <h3>Enroll to Access Resources</h3>
                <p>Please enroll in this course to access learning resources and materials.</p>
                <button className="enroll-btn" onClick={handleEnroll}>
                  Enroll Now
                </button>
              </div>
            ) : (
              <>
                <h2>Learning Resources</h2>
                <div className="resources-grid">
                  <div className="resource-card">
                    <h3>📚 Textbooks</h3>
                    <ul>
                      <li>"Python Programming for Beginners" - John Smith</li>
                      <li>"Clean Code" - Robert C. Martin</li>
                      <li>"The Pragmatic Programmer" - Andrew Hunt</li>
                    </ul>
                  </div>
                  
                  <div className="resource-card">
                    <h3>🔗 Online Resources</h3>
                    <ul>
                      <li><a href="#">Python Official Documentation</a></li>
                      <li><a href="#">Stack Overflow Community</a></li>
                      <li><a href="#">GitHub Learning Lab</a></li>
                    </ul>
                  </div>
                  
                  <div className="resource-card">
                    <h3>🛠 Tools & Software</h3>
                    <ul>
                      <li>Visual Studio Code</li>
                      <li>Python 3.8+</li>
                      <li>Git Version Control</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}