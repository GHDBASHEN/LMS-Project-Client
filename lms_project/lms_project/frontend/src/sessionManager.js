// Session Management Utility for LMS Frontend

import config from './config';

class SessionManager {
  constructor() {
    this.baseURL = config.API_BASE_URL;
    this.sessionKey = 'lms_session';
    this.debug = config.DEBUG;
  }

  // Helper method for conditional logging
  log(message, data = null) {
    if (this.debug) {
      console.log(message, data);
    }
  }
  getCSRFToken() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'lms_csrftoken') {
        return value;
      }
    }
    return null;
  }

  // Login with session creation
  async login(username, password) {
    try {
      const csrfToken = this.getCSRFToken();
      
      const response = await fetch(`${this.baseURL}/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store session info in localStorage for reference
        localStorage.setItem(this.sessionKey, JSON.stringify({
          sessionId: data.session_id,
          username: data.username,
          role: data.role,
          token: data.token,
          loginTime: new Date().toISOString()
        }));

        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: data.error
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Network error'
      };
    }
  }

  // Logout and clear session
  async logout() {
    try {
      const csrfToken = this.getCSRFToken();
      
      await fetch(`${this.baseURL}/logout/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
      });

      // Clear local storage regardless of response
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem('token');
      localStorage.removeItem('role');

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Clear local storage even if logout fails
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      
      return {
        success: false,
        error: 'Logout failed'
      };
    }
  }

  // Check if session is valid
  async checkSession() {
    try {
      const response = await fetch(`${this.baseURL}/check-session/`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        valid: false,
        message: 'Session check failed'
      };
    }
  }

  // Get session information
  async getSessionInfo() {
    try {
      const response = await fetch(`${this.baseURL}/session-info/`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        is_authenticated: false,
        message: 'Failed to get session info'
      };
    }
  }

  // Extend session
  async extendSession() {
    try {
      const response = await fetch(`${this.baseURL}/extend-session/`, {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Failed to extend session'
      };
    }
  }

  // Get stored session data
  getStoredSession() {
    const sessionData = localStorage.getItem(this.sessionKey);
    return sessionData ? JSON.parse(sessionData) : null;
  }

  // Check if user is logged in (local check)
  isLoggedIn() {
    const sessionData = this.getStoredSession();
    return sessionData !== null;
  }

  // Get user role
  getUserRole() {
    const sessionData = this.getStoredSession();
    return sessionData ? sessionData.role : null;
  }

  // Get username
  getUsername() {
    const sessionData = this.getStoredSession();
    return sessionData ? sessionData.username : null;
  }

  // Auto-extend session (call this periodically)
  async autoExtendSession() {
    const sessionData = this.getStoredSession();
    if (sessionData) {
      const loginTime = new Date(sessionData.loginTime);
      const now = new Date();
      const timeDiff = now - loginTime;
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // Extend session if it's been active for more than 45 minutes
      if (hoursDiff > 0.75) {
        const result = await this.extendSession();
        if (result.message) {
          this.log('Session extended automatically');
        }
      }
    }
  }
}

// Create a singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
