// lms_project/lms_project/frontend/src/api.js

import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/', 
});

// ✅ CRITICAL FIX: The Request Interceptor
api.interceptors.request.use(
  (config) => {
    try {
      const sessionData = localStorage.getItem('lms_session');
      
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);
        const token = parsedSession.token; // Retrieves the token like '5a2a1ad74a0701d4197e4dae4034d69e66fd8942'

        if (token) {
          // MUST use 'Token' because your Django settings.py uses TokenAuthentication
          config.headers.Authorization = `Token ${token}`;
        }
      }
    } catch (error) {
      console.error('Failed to retrieve or parse session data:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;