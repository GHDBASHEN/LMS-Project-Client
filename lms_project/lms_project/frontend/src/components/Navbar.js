import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import sessionManager from '../sessionManager';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const logo = "/Images/WhatsApp Image 2025-08-05 at 4.15.25 PM.jpeg";

  useEffect(() => {
    checkLoginStatus();
    
    // Listen for storage changes (when login/logout happens in other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'lms_session') {
        checkLoginStatus();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom login events
    const handleLoginEvent = () => {
      checkLoginStatus();
    };
    
    window.addEventListener('userLoggedIn', handleLoginEvent);
    window.addEventListener('userLoggedOut', handleLoginEvent);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userLoggedIn', handleLoginEvent);
      window.removeEventListener('userLoggedOut', handleLoginEvent);
    };
  }, []);

  const checkLoginStatus = () => {
    const sessionData = sessionManager.getStoredSession();
    if (sessionData) {
      setIsLoggedIn(true);
      setUserInfo(sessionData);
    } else {
      setIsLoggedIn(false);
      setUserInfo(null);
    }
  };

  const handleLogout = async () => {
    try {
      await sessionManager.logout();
      setIsLoggedIn(false);
      setUserInfo(null);
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API fails
      setIsLoggedIn(false);
      setUserInfo(null);
      
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('userLoggedOut'));
      
      navigate('/login');
    }
  }; 

  return (
    <nav className="navbar">
      <div className="navbar-container">
       <div className="navbar-logo">
       <img src={logo} alt="LMS Logo" className="logo-image" />
       LearnVista
       </div>
        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
        </div>

        <ul className={`navbar-links ${isOpen ? 'active' : ''}`}>
          <li><Link to="/" onClick={() => setIsOpen(false)}>Home</Link></li>
          
          {isLoggedIn ? (
            <>
              <li><Link to="/profile" onClick={() => setIsOpen(false)}>Profile</Link></li>
              <li><Link to="/courses" onClick={() => setIsOpen(false)}>Courses</Link></li>
              {userInfo?.role === 'student' && (
                <li><Link to="/student-dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link></li>
              )}
              {userInfo?.role === 'lecturer' && (
                <li><Link to="/lecturer-dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link></li>
              )}
              {userInfo?.role === 'superadmin' && (
                <li><Link to="/admin-dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link></li>
              )}
              <li>
                <button 
                  className="logout-btn" 
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i> Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/login" onClick={() => setIsOpen(false)}>Login</Link></li>
              <li><Link to="/signup" onClick={() => setIsOpen(false)}>Sign Up</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
