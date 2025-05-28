import axios from 'axios';
import { API_CONFIG } from '../config/api';

const instance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: true // This ensures cookies are sent with every request
});

// No need for request interceptor to add token as we're using HTTP-only cookies
// The browser will automatically include the cookie with each request

// Add a response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login on authentication error
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance; 