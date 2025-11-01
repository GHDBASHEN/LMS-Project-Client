import React from 'react';
import sessionManager from '../sessionManager';
import { useNavigate } from 'react-router-dom';

function LogoutButton({ className = '', children = 'Logout' }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        const result = await sessionManager.logout();
        
        if (result.success) {
          alert('Logged out successfully');
          navigate('/login');
        } else {
          alert('Logout failed: ' + result.error);
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
      }
    }
  };

  return (
    <button 
      onClick={handleLogout}
      className={className}
      type="button"
    >
      {children}
    </button>
  );
}

export default LogoutButton;
