import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import sessionManager from '../sessionManager';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignupClick = () => {
    navigate('/signup');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await sessionManager.login(username, password);

      if (result.success) {
        const { data } = result;
        
        // Dispatch login event for navbar update
        window.dispatchEvent(new CustomEvent('userLoggedIn', { 
          detail: { username: data.username, role: data.role } 
        }));
        
        // Navigate based on role - Use direct navigation for reliability
        if (data.role === 'student') {
          window.location.href = '/student-dashboard';
        } else if (data.role === 'lecturer') {
          window.location.href = '/lecturer-dashboard';
        } else if (data.role === 'superadmin') {
          window.location.href = '/admin-dashboard';
        } else {
          window.location.href = '/dashboard';
        }
        
        // Check if navigation worked after a short delay
        setTimeout(() => {
          if (!window.location.href.includes('/admin-dashboard') && !window.location.href.includes('/student-dashboard') && !window.location.href.includes('/lecturer-dashboard')) {
            window.location.href = '/admin-dashboard';
          }
        }, 1000);
        
      } else {
        alert('Login failed: ' + result.error);
      }
    } catch (error) {
      alert('Error connecting to server: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="glass-card" onSubmit={handleLogin}>
          <h2>Welcome Back</h2>
          <p className="login-subtitle">Sign in to access your personalized dashboard</p>
          
          <div className="role-info">
            <div className="role-badge student">
              <i className="fas fa-graduation-cap"></i>
              <span>Student Portal</span>
            </div>
            <div className="role-badge lecturer">
              <i className="fas fa-chalkboard-teacher"></i>
              <span>Lecturer Portal</span>
            </div>
            <div className="role-badge admin">
              <i className="fas fa-user-shield"></i>
              <span>Admin Portal</span>
            </div>
          </div>
          
          <input
            type="text"
            className="input-field"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          <Link to="#" className="forgot-link">Forgot your password?</Link>
        </form>

        <div className="side-card">
          <h2>New here?</h2>
          <p>Create an account to access courses, grades, and more.</p>
          <button 
            className="signup-btn" 
            onClick={handleSignupClick}
            type="button"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;