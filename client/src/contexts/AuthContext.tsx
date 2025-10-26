import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
  avatar?: string;
  storageUsed?: number;
  storageLimit?: number;
  settings?: {
    notifications?: {
      email?: boolean;
      push?: boolean;
      updates?: boolean;
    };
    privacy?: {
      publicProfile?: boolean;
      showActivity?: boolean;
      shareStats?: boolean;
    };
    security?: {
      twoFactor?: boolean;
    };
    appearance?: {
      darkMode?: boolean;
    };
    language?: string;
  };
}

export interface StorageInfo {
  storageUsed: number;
  storageLimit: number;
  storagePercentage: number;
  isNearlyFull: boolean;
  isCriticallyFull: boolean;
  remainingStorage: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  getStorageInfo: () => Promise<StorageInfo>;
  isLoading: boolean;
  error: string | null;
}

const API_URL = 'http://localhost:5001/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // Check if we have a token in localStorage
        const token = localStorage.getItem('token');
        
        // Only verify if we're not on public pages
        const currentPath = window.location.pathname;
        const publicPaths = ['/login', '/register', '/', '/about', '/contact'];
        
        if (publicPaths.includes(currentPath)) {
          setIsLoading(false);
          return;
        }
        
        // If no token, clear auth state
        if (!token) {
          console.log('[Auth] No token found, user not authenticated');
          setUser(null);
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        // Check cache first (avoid unnecessary API calls)
        const cachedUser = localStorage.getItem('user');
        const cacheTimestamp = localStorage.getItem('userCacheTime');
        const now = Date.now();
        
        // Use cache if less than 5 minutes old
        if (cachedUser && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 5 * 60 * 1000) {
          console.log('[Auth] Using cached user data');
          const userData = JSON.parse(cachedUser);
          setUser(userData);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
        
        // Verify token with backend
        console.log('[Auth] Verifying token with backend for path:', currentPath);
        const response = await axios.get(API_ENDPOINTS.AUTH.VERIFY);
        console.log('[Auth] Verification successful, user:', response.data.name);
        
        // Cache user data
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('userCacheTime', now.toString());
        
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error: any) {
        // Don't log errors for unauthenticated users (401/404) - this is expected
        if (error?.response?.status !== 401 && error?.response?.status !== 404) {
          console.error('[Auth] Verification failed with unexpected error:', error);
        }
        
        // Clear all auth data on failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userCacheTime');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      console.log('[Auth] Login successful, user data:', response.data);
      
      // Store token in localStorage (permanent solution for cross-domain)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('[Auth] ✅ Token stored in localStorage');
      } else {
        console.warn('[Auth] ⚠️  No token received from backend');
      }
      
      // Remove token from user object before storing
      const { token, ...userData } = response.data;
      
      // Cache user data with timestamp
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userCacheTime', Date.now().toString());
      console.log('[Auth] ✅ User data cached');
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error: any) {
      console.error('[Auth] ❌ Login failed:', error);
      setError(error.response?.data?.message || 'An error occurred during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, { name, email, password });
      console.log('[Auth] Registration successful, user data:', response.data);
      
      // Store token in localStorage (permanent solution for cross-domain)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        console.log('[Auth] ✅ Token stored in localStorage');
      } else {
        console.warn('[Auth] ⚠️  No token received from backend');
      }
      
      // Remove token from user object before storing
      const { token, ...userData } = response.data;
      
      // Cache user data with timestamp
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userCacheTime', Date.now().toString());
      console.log('[Auth] ✅ User data cached');
      
      setUser(userData);
      setIsAuthenticated(true);
      return userData;
    } catch (error: any) {
      console.error('[Auth] ❌ Registration failed:', error);
      setError(error.response?.data?.message || 'An error occurred during registration');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.error('[Auth] Error during logout:', error);
    } finally {
      // Clear all auth data from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userCacheTime');
      console.log('[Auth] ✅ All auth data cleared from localStorage');
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      
      const updatedUser = { ...prev, ...userData };
      
      // Update cache
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('userCacheTime', Date.now().toString());
      console.log('[Auth] ✅ User cache updated');
      
      return updatedUser;
    });
  };

  // Function to calculate storage based on local files
  const calculateLocalStorage = (): StorageInfo => {
    try {
      // If we have files in localStorage, use them to estimate storage
      const filesJson = localStorage.getItem('files');
      let storageUsed = 0;
      
      if (filesJson) {
        const files = JSON.parse(filesJson);
        storageUsed = files.reduce((total: number, file: any) => total + (file.size || 0), 0);
      }
      
      // Default storage limit (5GB)
      const storageLimit = 5 * 1024 * 1024 * 1024;
      const storagePercentage = (storageUsed / storageLimit) * 100;
      
      return {
        storageUsed,
        storageLimit,
        storagePercentage: parseFloat(storagePercentage.toFixed(2)),
        isNearlyFull: storagePercentage > 80,
        isCriticallyFull: storagePercentage > 95,
        remainingStorage: storageLimit - storageUsed
      };
    } catch (error) {
      console.error('Error calculating local storage:', error);
      return getDefaultStorage();
    }
  };
  
  // Function to get default storage values
  const getDefaultStorage = (): StorageInfo => ({
    storageUsed: 0,
    storageLimit: 5 * 1024 * 1024 * 1024, // 5GB
    storagePercentage: 0,
    isNearlyFull: false,
    isCriticallyFull: false,
    remainingStorage: 5 * 1024 * 1024 * 1024
  });
  
  const getStorageInfo = async (): Promise<StorageInfo> => {
    // Check if API is likely available
    const apiAvailable = localStorage.getItem('apiAvailable') === 'true';
    
    if (!apiAvailable) {
      // Use local calculation if API was previously unavailable
      return calculateLocalStorage();
    }
    
    try {
      // Try to get storage info from the server
      const response = await axios.get(API_ENDPOINTS.USERS.STORAGE);
      // Mark API as available for future calls
      localStorage.setItem('apiAvailable', 'true');
      return response.data;
    } catch (error) {
      // Mark API as unavailable to avoid future unnecessary calls
      localStorage.setItem('apiAvailable', 'false');
      
      // Don't log the error to console to avoid cluttering it
      // console.error('Error fetching storage info:', error);
      
      // Fall back to local calculation
      return calculateLocalStorage();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser, getStorageInfo, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 