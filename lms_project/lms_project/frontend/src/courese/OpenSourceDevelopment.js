import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursePage.css";

export default function OpenSourceDevelopment() {
  const navigate = useNavigate();
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const course = {
    id: 5,
    title: "Open Source Development",
    code: "CS305",
    instructor: "David Kim",
    duration: "7 weeks",
    level: "Intermediate",
    rating: 4.5,
    students: 634,
    progress: 0,
    description: "Learn how to contribute to open source projects, collaborate with global developers, and build your portfolio.",
    objectives: [
      "Understand open source ecosystem",
      "Learn Git and GitHub workflows",
      "Contribute to real projects",
      "Collaborate with maintainers",
      "Build your developer reputation"
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
      alert("Successfully enrolled in Open Source Development!");
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
                Join Open Source Community
              </button>
            ) : (
              <div className="enrollment-status">
                <span className="status-badge enrolled">✅ Enrolled</span>
                <button className="continue-btn">Start Contributing</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tab-content">
        <div className="overview-tab">
          <h2>Become an Open Source Contributor</h2>
          <p>This course will guide you through the process of finding projects, making contributions, and becoming part of the open source community.</p>
        </div>
      </div>
    </div>
  );
}