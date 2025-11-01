// import React from 'react';
// import './Home.css';

// const courses = [
//   { id: 1, title: "Programming Laboratory", description: "Hands-on programming practice with real-world problems.", duration: "6 weeks", image: "/Images/co1.jpeg" },
//   { id: 2, title: "Visual Computing", description: "Learn about computer vision, graphics, and visualization.", duration: "8 weeks", image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80" },
//   { id: 3, title: "Electrical Engineering", description: "Fundamentals of circuits, signals, and power systems.", duration: "10 weeks", image: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=400&q=80" },
//   { id: 4, title: "Fundamentals of Programming", description: "Learn programming concepts from scratch.", duration: "5 weeks", image: "/Images/co4.jpeg" },
//   { id: 6, title: "Python Programming", description: "Master Python for web, data, and automation.", duration: "6 weeks", image: "/Images/co6.jpeg" },
//   { id: 24, title: "Data Structures and Algorithms", description: "Master core programming concepts and efficiency.", duration: "8 weeks", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80" }
// ];

// const Home = () => {
//   return (
//     <div className="home-hero">
//       <div className="overlay">
//         <div className="hero-content">
//           <h1>Welcome to LMS</h1>
//           <p>Empower your learning. Achieve your goals with our smart education platform.</p>
//           <div className="hero-buttons">
//             <a href="/courses" className="btn primary">Browse Courses</a>
//             <a href="/login" className="btn secondary">Login</a>
//           </div>
//         </div>
//       </div>

//       <section className="features">
//         <div className="feature-box">
//           <h3>📘 Access Courses</h3>
//           <p>Learn from a wide range of curated content in multiple domains.</p>
//         </div>
//         <div className="feature-box">
//           <h3>📊 Track Your Progress</h3>
//           <p>Visualize your learning journey with progress tracking and reports.</p>
//         </div>
//         <div className="feature-box">
//           <h3>🧠 Personalized Learning</h3>
//           <p>Get recommendations based on your goals and past performance.</p>
//         </div>
//       </section>

//       {/* Popular Courses Section */}
//       <section className="popular-courses-section">
//         <h2 className="section-title">Popular Courses</h2>
//         <div className="courses-grid">
//           {courses.map(course => (
//             <div key={course.id} className="course-card">
//               <div
//                 className="course-image"
//                 style={{ backgroundImage: `url(${course.image})` }}
//                 alt={course.title}
//               />
//               <div className="course-info">
//                 <h3>{course.title}</h3>
//                 <p>{course.description}</p>
//                 <span className="duration">{course.duration}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       </section>
//     </div>
//   );
// };

// export default Home;



import React from 'react';
import './Home.css';

const courses = [
  { id: 1, title: "Programming Laboratory", description: "Hands-on programming practice with real-world problems.", duration: "6 weeks", image: "/Images/co1.jpeg", rating: 4.8, students: 1250 },
  { id: 2, title: "Visual Computing", description: "Learn about computer vision, graphics, and visualization.", duration: "8 weeks", image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?auto=format&fit=crop&w=400&q=80", rating: 4.5, students: 890 },
  { id: 3, title: "Electrical Engineering", description: "Fundamentals of circuits, signals, and power systems.", duration: "10 weeks", image: "https://images.unsplash.com/photo-1500674425229-f692875b0ab7?auto=format&fit=crop&w=400&q=80", rating: 4.7, students: 1100 },
  { id: 4, title: "Fundamentals of Programming", description: "Learn programming concepts from scratch.", duration: "5 weeks", image: "/Images/co4.jpeg", rating: 4.9, students: 2300 },
  { id: 6, title: "Python Programming", description: "Master Python for web, data, and automation.", duration: "6 weeks", image: "/Images/co6.jpeg", rating: 4.8, students: 1850 },
  { id: 24, title: "Data Structures and Algorithms", description: "Master core programming concepts and efficiency.", duration: "8 weeks", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80", rating: 4.6, students: 1500 }
];

const testimonials = [
  { id: 1, name: "Sarah Johnson", role: "Computer Science Student", text: "This platform transformed how I learn. The courses are engaging and practical.", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80" },
  { id: 2, name: "Michael Chen", role: "Software Engineer", text: "The quality of instruction is exceptional. I've upgraded my skills significantly.", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80" },
  { id: 3, name: "Emma Rodriguez", role: "Data Analyst", text: "The progress tracking features helped me stay motivated and complete my learning goals.", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80" }
];

const stats = [
  { number: "10,000+", label: "Active Students" },
  { number: "200+", label: "Expert Instructors" },
  { number: "50+", label: "Courses Available" },
  { number: "95%", label: "Satisfaction Rate" }
];

const Home = () => {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="overlay">
          <div className="hero-content">
            <h1>Welcome to LMS</h1>
            <p>Empower your learning. Achieve your goals with our smart education platform.</p>
            <div className="hero-buttons">
              <a href="/courses" className="btn primary">Browse Courses</a>
              <a href="/login" className="btn secondary">Login</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <h3>{stat.number}</h3>
              <p>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why Choose Our Platform</h2>
        <div className="features-container">
          <div className="feature-box">
            <div className="feature-icon">📘</div>
            <h3>Access Courses</h3>
            <p>Learn from a wide range of curated content in multiple domains.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">📊</div>
            <h3>Track Your Progress</h3>
            <p>Visualize your learning journey with progress tracking and reports.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">🧠</div>
            <h3>Personalized Learning</h3>
            <p>Get recommendations based on your goals and past performance.</p>
          </div>
          <div className="feature-box">
            <div className="feature-icon">👥</div>
            <h3>Community Support</h3>
            <p>Connect with fellow learners and experts for guidance.</p>
          </div>
        </div>
      </section>

      {/* Popular Courses Section */}
      <section className="popular-courses-section">
        <h2 className="section-title">Popular Courses</h2>
        <p className="section-subtitle">Discover our most enrolled courses</p>
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div
                className="course-image"
                style={{ backgroundImage: `url(${course.image})` }}
                alt={course.title}
              />
              <div className="course-info">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-meta">
                  <span className="duration">{course.duration}</span>
                  <div className="course-rating">
                    <span className="stars">★★★★★</span>
                    <span>{course.rating}</span>
                  </div>
                </div>
                <div className="enrollment">{course.students.toLocaleString()} students</div>
              </div>
            </div>
          ))}
        </div>
        <div className="view-all-container">
          <a href="/courses" className="btn outline">View All Courses</a>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <h2 className="section-title">What Our Students Say</h2>
        <p className="section-subtitle">Hear from our learning community</p>
        <div className="testimonials-container">
          {testimonials.map(testimonial => (
            <div key={testimonial.id} className="testimonial-card">
              <div className="testimonial-content">
                <p>"{testimonial.text}"</p>
              </div>
              <div className="testimonial-author">
                <img src={testimonial.avatar} alt={testimonial.name} className="testimonial-avatar" />
                <div className="author-info">
                  <h4>{testimonial.name}</h4>
                  <p>{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <h2>Ready to Start Your Learning Journey?</h2>
          <p>Join thousands of students achieving their goals with our platform</p>
          <div className="cta-buttons">
            <a href="/signup" className="btn primary">Sign Up Now</a>
            <a href="/courses" className="btn secondary">Browse Courses</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;