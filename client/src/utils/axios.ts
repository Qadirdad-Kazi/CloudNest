import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // If VITE_API_URL is explicitly set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, use relative path to leverage Netlify proxy
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // In development, use localhost
  return 'http://localhost:5001/api';
};

const instance = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor
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

// Add response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle 401 errors with throttling to prevent infinite loops
    if (error.response?.status === 401) {
      const lastRedirectTime = localStorage.getItem('lastAuthRedirect');
      const currentTime = Date.now();
      
      // Only redirect if we haven't redirected in the last 10 seconds
      if (!lastRedirectTime || (currentTime - parseInt(lastRedirectTime)) > 10000) {
        localStorage.setItem('lastAuthRedirect', currentTime.toString());
        localStorage.removeItem('token');
        window.location.href = '/login';
      } else {
        console.warn('Prevented redirect loop: Too many 401 redirects in a short time');
      }
    }
    
    // Handle network errors (likely CORS issues)
    if (error.message && (error.message.includes('Network Error') || !error.response)) {
      console.error('Network error (possibly CORS):', error.message);
      // Don't redirect on network errors, just log them
    }
    
    return Promise.reject(error);
  }
);

export default instance; 