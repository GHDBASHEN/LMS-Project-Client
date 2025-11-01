import React, { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [enrollments, setEnrollments] = useState([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    // Use the correct endpoint that exists
    axios.get("http://127.0.0.1:8000/api/my-courses/", {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    }).then(res => setEnrollments(res.data))
    .catch(error => {
      console.error("Error fetching courses:", error);
      setEnrollments([]);
    });
  }, [token]);

  return (
    <div>
      <h1>My Enrolled Courses</h1>
      {enrollments.length === 0 ? (
        <p>No courses enrolled yet.</p>
      ) : (
        <ul>
          {enrollments.map((enroll) => (
            <li key={enroll.id}>
              {enroll.course?.title || enroll.title} - {enroll.course?.duration || enroll.duration}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
