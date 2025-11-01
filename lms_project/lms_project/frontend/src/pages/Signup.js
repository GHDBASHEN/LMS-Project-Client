import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

function Signup() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log('🔍 Attempting signup...');
    console.log('User data:', { username, email, password: '***' });

    const userData = { username, email, password };

    try {
      const response = await fetch('http://127.0.0.1:8000/api/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      console.log('Signup response status:', response.status);
      const data = await response.json();
      console.log('Signup response data:', data);

      if (response.ok) {
        alert('Signup successful! Please login with your credentials.');
        console.log('✅ Signup successful, redirecting to login...');
        navigate('/login'); // Redirect to login page after signup
      } else {
        console.error('❌ Signup failed:', data.error);
        alert(data.error || 'Signup failed.');
      }
    } catch (error) {
      console.error('❌ Network error during signup:', error);
      alert('Error connecting to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <form className="glass-card" onSubmit={handleSignup}>
          <h2>Create Account</h2>
          <input
            type="email"
            className="input-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="text"
            className="input-field"
            placeholder="Username"
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
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
          <Link to="/login" className="forgot-link">Already have an account? Sign in</Link>
        </form>
        <div className="side-card">
          <h2>Welcome!</h2>
          <p>Join us and explore all features of the LMS.</p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
