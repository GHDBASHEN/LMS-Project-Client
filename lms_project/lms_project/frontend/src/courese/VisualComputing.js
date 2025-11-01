import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursePage.css";

export default function VisualComputing() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const course = {
    id: 2,
    title: "Visual Computing",
    code: "CS202",
    instructor: "Prof. Michael Chen",
    duration: "8 weeks",
    level: "Intermediate",
    rating: 4.6,
    students: 893,
    progress: 0,
    description: "Learn about computer vision, graphics, and visualization techniques for creating immersive visual experiences.",
    objectives: [
      "Understand computer vision fundamentals",
      "Master image processing techniques",
      "Learn 3D graphics programming",
      "Create data visualizations",
      "Build interactive visual applications"
    ]
  };

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
      await axios.post("http://127.0.0.1:8000/api/enroll/", {
        course_id: course.id
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      setEnrollmentStatus("enrolled");
      alert("Successfully enrolled in Visual Computing!");
    } catch (error) {
      alert(error.response?.data?.detail || "Enrollment failed");
    }
  };

  if (loading) {
    return <div className="loading">Loading course...</div>;
  }

  return (
    <div className="course-page">
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
                <button className="continue-btn">Start Learning</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="course-tabs">
        <button className={`tab ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
          📚 Overview
        </button>
        <button className={`tab ${activeTab === "syllabus" ? "active" : ""}`} onClick={() => setActiveTab("syllabus")}>
          📖 Syllabus
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "overview" && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="course-description">
                <h2>Course Description</h2>
                <p>{course.description}</p>
                
                <h3>What You'll Learn</h3>
                <ul className="objectives-list">
                  {course.objectives.map((objective, index) => (
                    <li key={index}>✅ {objective}</li>
                  ))}
                </ul>

                <h3>Technologies Covered</h3>
                <div className="tech-stack">
                  <span className="tech-tag">OpenCV</span>
                  <span className="tech-tag">Three.js</span>
                  <span className="tech-tag">WebGL</span>
                  <span className="tech-tag">D3.js</span>
                  <span className="tech-tag">Python</span>
                </div>
              </div>
              
              <div className="course-sidebar">
                <div className="instructor-card">
                  <h3>About Instructor</h3>
                  <div className="instructor-info">
                    <div className="instructor-avatar">MC</div>
                    <div className="instructor-details">
                      <h4>{course.instructor}</h4>
                      <p>Computer Graphics Specialist</p>
                      <p>PhD in Computer Science</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "syllabus" && (
          <div className="syllabus-tab">
            <h2>Course Syllabus</h2>
            <div className="syllabus-content">
              <div className="week-plan">
                <h3>Week 1-2: Introduction to Computer Vision</h3>
                <ul>
                  <li>Image processing fundamentals</li>
                  <li>OpenCV basics</li>
                  <li>Feature detection</li>
                </ul>
              </div>
              <div className="week-plan">
                <h3>Week 3-4: 3D Graphics</h3>
                <ul>
                  <li>3D transformations</li>
                  <li>WebGL introduction</li>
                  <li>3D modeling basics</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}