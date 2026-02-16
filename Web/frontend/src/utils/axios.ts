import axios from 'axios';

// Determine the base URL based on environment
const getBaseURL = () => {
  // Priority 1: If VITE_API_URL is explicitly set, use it (allows easy hosting changes)
  if (import.meta.env.VITE_API_URL) {
    let apiUrl = import.meta.env.VITE_API_URL;
    
    // Ensure the URL has a protocol
    if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://')) {
      apiUrl = `https://${apiUrl}`;
      console.log('[Axios] Added https:// protocol to VITE_API_URL');
    }
    
    console.log('[Axios] Using VITE_API_URL:', apiUrl);
    return apiUrl;
  }
  
  // Priority 2: In development, use localhost
  if (import.meta.env.DEV) {
    console.log('[Axios] Development mode detected, using: http://localhost:5001/api');
    return 'http://localhost:5001/api';
  }
  
  // Priority 3: Production fallback - use relative path (works with proxy)
  console.log('[Axios] Production mode, no VITE_API_URL set, using relative path: /api');
  return '/api';
};

const baseURL = getBaseURL();
console.log('[Axios] Final baseURL:', baseURL);

const instance = axios.create({
  baseURL,
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

// Add response interceptor for auth errors and caching
instance.interceptors.response.use(
  (response) => {
    // Successful response - cache it if it's a GET request
    if (response.config.method === 'get' && response.config.url) {
      const cacheKey = `api_cache_${response.config.url}`;
      const cacheData = {
        data: response.data,
        timestamp: Date.now()
      };
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // Ignore cache storage errors (quota exceeded)
        console.warn('[Cache] Failed to store cache:', e);
      }
    }
    return response;
  },
  async (error) => {
    // Handle 401 errors (unauthorized) with throttling
    if (error.response?.status === 401) {
      const lastRedirectTime = localStorage.getItem('lastAuthRedirect');
      const currentTime = Date.now();
      
      // Only redirect if we haven't redirected in the last 10 seconds
      if (!lastRedirectTime || (currentTime - parseInt(lastRedirectTime)) > 10000) {
        console.log('[Axios] 401 Unauthorized - Clearing auth and redirecting to login');
        localStorage.setItem('lastAuthRedirect', currentTime.toString());
        
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userCacheTime');
        
        // Only redirect if not already on login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } else {
        console.warn('[Axios] Prevented redirect loop: Too many 401 redirects in a short time');
      }
    }
    
    // Handle network errors (likely CORS issues)
    if (error.message && (error.message.includes('Network Error') || !error.response)) {
      console.error('[Axios] Network error (possibly CORS):', error.message);
      // Don't redirect on network errors, just log them
    }
    
    return Promise.reject(error);
  }
);

export default instance; 