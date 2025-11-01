// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Home from './pages/Home';
// import Navbar from './components/Navbar';  
// import Login from './pages/Login';
// import Signup from './pages/Signup';
// import Dashboard from './pages/Dashboard';
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import Profile from "./pages/Profile";
// import Courses from "./pages/Courses";

// // New imports
// import StudentDashboard from "./pages/StudentDashboard";
// import LecturerDashboard from "./pages/LecturerDashboard";
// import AdminDashboard from "./pages/AdminDashboard";
// import ProtectedRoute from "./components/ProtectedRoute";

// import Chatbot from './pages/AdvancedChatbot';

// function App() {
//   return (
//     <Router>
//       <Navbar /> 
//       <Chatbot/>
//       <Routes>
//         {/* old routes (keep as-is) */}
//         <Route path="/" element={<Home />} />
//         <Route path="/login" element={<Login />} /> 
//         <Route path="/signup" element={<Signup />} /> 
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/profile" element={<Profile />} />
//         <Route path="/courses" element={<Courses />} />

//         {/* ✅ new role-based dashboards */}
//         <Route 
//           path="/student-dashboard" 
//           element={
//             <ProtectedRoute role="student">
//               <StudentDashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/lecturer-dashboard" 
//           element={
//             <ProtectedRoute role="lecturer">
//               <LecturerDashboard />
//             </ProtectedRoute>
//           } 
//         />
//         <Route 
//           path="/admin-dashboard" 
//           element={
//             <ProtectedRoute role="superadmin">
//               <AdminDashboard />
//             </ProtectedRoute>
//           } 
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar';  
import Login from './pages/Login';
import Signup from './pages/Signup';
import '@fortawesome/fontawesome-free/css/all.min.css';
import Profile from "./pages/Profile";
import Courses from "./pages/Courses";
import CoursePage from "./pages/CoursePage";

// New imports
import StudentDashboard from "./pages/StudentDashboard";
import LecturerDashboard from "./pages/LecturerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import IndustrialDashboard from "./pages/IndustrialDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Chatbot from './pages/AdvancedChatbot';

// Course Pages Import
import ProgrammingLab from "./courese/ProgrammingLab";
import VisualComputing from "./courese/VisualComputing";
import ElectricalEngineering from "./courese/ElectricalEngineering";
import FundamentalsProgramming from "./courese/FundamentalsProgramming";
import OpenSourceDevelopment from "./courese/OpenSourceDevelopment";

// New Individual Course Pages
import ProgrammingLaboratory from "./pages/courses/ProgrammingLaboratory";
import VisualComputingNew from "./pages/courses/VisualComputing";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Navbar /> 
        <Chatbot/>
        <Routes>
        {/* old routes (keep as-is) */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} /> 
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/courses" element={<Courses />} />
        <Route path="/course/:courseId" element={
          <ProtectedRoute>
            <CoursePage />
          </ProtectedRoute>
        } />

        {/* ✅ Industrial Dashboard - Main Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <IndustrialDashboard />
            </ProtectedRoute>
          } 
        />

        {/* ✅ Legacy role-based dashboards */}
        <Route 
          path="/student-dashboard" 
          element={<StudentDashboard />}
        />
        <Route 
          path="/lecturer-dashboard" 
          element={
            <ProtectedRoute>
              <LecturerDashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/admin-dashboard" 
          element={<AdminDashboard />}
        />

        {/* ✅ Course Pages Routes */}
        <Route 
          path="/course/programming-lab" 
          element={
            <ProtectedRoute>
              <ProgrammingLab />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/visual-computing" 
          element={
            <ProtectedRoute>
              <VisualComputing />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/electrical-engineering" 
          element={
            <ProtectedRoute>
              <ElectricalEngineering />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/fundamentals-programming" 
          element={
            <ProtectedRoute>
              <FundamentalsProgramming />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/open-source-development" 
          element={
            <ProtectedRoute>
              <OpenSourceDevelopment />
            </ProtectedRoute>
          } 
        />

        {/* ✅ New Individual Course Pages */}
        <Route 
          path="/course/programming-laboratory" 
          element={
            <ProtectedRoute>
              <ProgrammingLaboratory />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/course/visual-computing-new" 
          element={
            <ProtectedRoute>
              <VisualComputingNew />
            </ProtectedRoute>
          } 
        />

        {/* ✅ Chatbot */}
        <Route 
          path="/chatbot" 
          element={
            <ProtectedRoute>
              <Chatbot />
            </ProtectedRoute>
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
