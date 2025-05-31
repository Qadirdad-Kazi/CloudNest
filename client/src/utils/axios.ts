import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 120000, // 2 minutes
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized errors
      if (error.response.status === 401) {
        // Only redirect to login if we're not already on the login page
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      }
      // Handle other error responses
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default instance; 