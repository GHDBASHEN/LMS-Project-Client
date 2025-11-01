import "./Courses.css";
import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import sessionManager from "../sessionManager";

const CoursesData = [
  {
    id: 54,
    title: "Programming Laboratory",
    description: "Hands-on programming practice with real-world problems.",
    duration: "6 weeks",
    image: "/Images/co1.jpeg",
  },
  {
    id: 55,
    title: "Visual Computing",
    description: "Learn about computer vision, graphics, and visualization.",
    duration: "8 weeks",
    image:
      "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 56,
    title: "Electrical Engineering",
    description: "Fundamentals of circuits, signals, and power systems.",
    duration: "10 weeks",
    image:
      "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 57,
    title: "Fundamentals of Programming",
    description: "Learn programming concepts from scratch.",
    duration: "5 weeks",
    image: "/Images/co4.jpeg",
  },
  {
    id: 58,
    title: "Open Source Development",
    description: "Contribute to and build open source software.",
    duration: "7 weeks",
    image: "/Images/co5.png",
  },
  {
    id: 59,
    title: "Python Programming",
    description: "Master Python for web, data, and automation.",
    duration: "6 weeks",
    image: "/Images/co6.jpeg",
  },
  {
    id: 60,
    title: "System Administration and Maintenance",
    description: "Manage and maintain IT systems effectively.",
    duration: "8 weeks",
    image: "/Images/co7.jpeg",
  },
  {
    id: 61,
    title: "System Analysis and Design",
    description: "Plan, design, and implement information systems.",
    duration: "7 weeks",
    image:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 62,
    title: "Information Technology Concepts",
    description: "Overview of IT systems, hardware, and software.",
    duration: "4 weeks",
    image:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 63,
    title: "Computer Architecture and Organization",
    description: "Understand how computers are built and work.",
    duration: "6 weeks",
    image: "/Images/co10.jpeg",
  },
  {
    id: 64,
    title: "Graphic Design and Animation",
    description: "Create digital graphics and engaging animations.",
    duration: "6 weeks",
    image:
      "https://images.unsplash.com/photo-1504196606672-aef5c9cefc92?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 65,
    title: "Career Development Plan",
    description: "Prepare your skills and plan for career success.",
    duration: "3 weeks",
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 66,
    title: "Mobile Application Development",
    description: "Build apps for Android and iOS platforms.",
    duration: "8 weeks",
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 67,
    title: "Information Security",
    description: "Protect systems and networks from cyber threats.",
    duration: "7 weeks",
    image:
      "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 68,
    title: "Research Methodology and Statistics",
    description: "Conduct research and analyze data effectively.",
    duration: "5 weeks",
    image:
      "https://images.unsplash.com/photo-1505238680356-667803448bb6?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 69,
    title: "Entrepreneurship and Small Business",
    description: "Start and grow your own business.",
    duration: "6 weeks",
    image:
      "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 70,
    title: "Internet of Things and Applications",
    description: "Build smart devices and connected solutions.",
    duration: "8 weeks",
    image:
      "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 71,
    title: "Information Management Systems",
    description: "Organize and manage data-driven systems.",
    duration: "6 weeks",
    image:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 72,
    title: "Software Quality Engineering",
    description: "Ensure quality in software development.",
    duration: "6 weeks",
    image:
      "https://images.unsplash.com/photo-1556155092-8707de31f9c4?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 73,
    title: "Cloud Computing",
    description: "Deploy and manage applications in the cloud.",
    duration: "7 weeks",
    image:
      "https://images.unsplash.com/photo-1493217465235-252dd9c0d632?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 74,
    title: "ICT Project Management",
    description: "Plan and execute IT-related projects.",
    duration: "5 weeks",
    image:
      "https://images.unsplash.com/photo-1521791055366-0d553872125f?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 75,
    title: "Emerging Technologies in ICT",
    description: "Learn the latest trends and innovations in ICT.",
    duration: "6 weeks",
    image: "/Images/co21.jpeg",
  },
  {
    id: 76,
    title: "Human Computer Interaction",
    description: "Design user-friendly and accessible systems.",
    duration: "5 weeks",
    image:
      "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 77,
    title: "Data Structures and Algorithms",
    description: "Master core programming concepts and efficiency.",
    duration: "8 weeks",
    image:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
  },
  {
    id: 78,
    title: "Data Communication and Networking",
    description: "Understand networks and communication systems.",
    duration: "7 weeks",
    image: "/Images/co25.jpeg",
  },
];
export default function Courses() {
  const navigate = useNavigate();

  const handleEnroll = (course) => {
    // Check if user is logged in using sessionManager
    const sessionData = sessionManager.getStoredSession();
    if (!sessionData) {
      alert("You must be logged in to enroll.");
      navigate("/login");
      return;
    }

    // Navigate to the dynamic course page for all courses
    navigate(`/course/${course.id}`);
  };
  return (
    
    <div className="courses-container">
      <h1>Available IT Courses</h1>

      <div className="courses-grid">
        {CoursesData.map((course) => (
          <div key={course.id} className="course-card">
            <img src={course.image} alt={course.title} />
            <div className="course-content">
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <span className="duration">⏳ {course.duration}</span>
              <button
                className="enroll-btn"
                onClick={() => handleEnroll(course)}
              >
                Enroll Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
