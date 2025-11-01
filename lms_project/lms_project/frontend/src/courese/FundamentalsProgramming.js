import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CoursePage.css";

export default function FundamentalsProgramming() {
  const navigate = useNavigate();
  const [enrollmentStatus, setEnrollmentStatus] = useState("not-enrolled");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const course = {
    id: 4,
    title: "Fundamentals of Programming",
    code: "CS100",
    instructor: "Prof. Emily Davis",
    duration: "5 weeks",
    level: "Beginner",
    rating: 4.9,
    students: 2156,
    progress: 0,
    description: "Perfect for absolute beginners. Learn programming concepts from scratch with hands-on exercises and projects.",
    objectives: [
      "Understand basic programming concepts",
      "Write your first programs",
      "Learn problem-solving techniques",
      "Debug and fix errors",
      "Build simple applications"
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
      setEnrollmentStatus("not-enrolled");
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
      alert("Successfully enrolled in Fundamentals of Programming!");
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
                Start Learning for Free
              </button>
            ) : (
              <div className="enrollment-status">
                <span className="status-badge enrolled">✅ Enrolled</span>
                <button className="continue-btn">Continue Learning</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tab-content">
        <div className="overview-tab">
          <h2>Perfect for Complete Beginners</h2>
          <p>This course requires no prior programming experience. We'll start from the very basics and build up your skills step by step.</p>
        </div>
      </div>
    </div>
  );
}