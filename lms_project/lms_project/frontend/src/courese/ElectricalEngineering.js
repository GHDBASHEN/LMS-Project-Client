import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursePage.css";

export default function ElectricalEngineering() {
  const navigate = useNavigate();
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const course = {
    id: 3,
    title: "Electrical Engineering",
    code: "EE101",
    instructor: "Dr. Robert Williams",
    duration: "10 weeks",
    level: "Intermediate",
    rating: 4.7,
    students: 756,
    progress: 0,
    description: "Comprehensive course covering electrical circuits, signals, power systems, and electronic devices.",
    objectives: [
      "Understand circuit analysis techniques",
      "Learn signal processing fundamentals",
      "Master power system basics",
      "Design simple electronic circuits",
      "Use simulation tools effectively"
    ]
  };

  const checkEnrollmentStatus = useCallback(async () => {
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
    } finally {
      setLoading(false);
    }
  }, [token, course.id]);

  useEffect(() => {
    checkEnrollmentStatus();
  }, [checkEnrollmentStatus]);

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
      alert("Successfully enrolled in Electrical Engineering!");
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

      <div className="tab-content">
        <div className="overview-tab">
          <div className="overview-grid">
            <div className="course-description">
              <h2>Course Description</h2>
              <p>{course.description}</p>
              
              <h3>Course Content</h3>
              <ul className="objectives-list">
                {course.objectives.map((objective, index) => (
                  <li key={index}>✅ {objective}</li>
                ))}
              </ul>

              <h3>Tools & Software</h3>
              <div className="tech-stack">
                <span className="tech-tag">MATLAB</span>
                <span className="tech-tag">SPICE</span>
                <span className="tech-tag">Multisim</span>
                <span className="tech-tag">Arduino</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
