// Environment Configuration
const config = {
  development: {
    API_BASE_URL: 'http://127.0.0.1:8000/api',
    FRONTEND_URL: 'http://localhost:3000',
    DEBUG: true
  },
  production: {
    API_BASE_URL: process.env.REACT_APP_API_URL || 'https://yourdomain.com/api',
    FRONTEND_URL: process.env.REACT_APP_FRONTEND_URL || 'https://yourdomain.com',
    DEBUG: false
  }
};

// Get current environment
const getEnvironment = () => {
  return process.env.NODE_ENV === 'production' ? 'production' : 'development';
};

// Get current config
const getConfig = () => {
  return config[getEnvironment()];
};

export default getConfig();
