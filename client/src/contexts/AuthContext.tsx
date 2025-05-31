import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  token: string;
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
        console.log('Verifying authentication...');
        // Only verify if we're not on the login or register page
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register') {
          setIsLoading(false);
          return;
        }
        
        const response = await axios.get(API_ENDPOINTS.AUTH.VERIFY);
        console.log('Auth verification response:', response.data);
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth verification failed:', error);
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
      setUser(response.data);
      return response.data;
    } catch (error: any) {
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
      setUser(response.data);
    } catch (error: any) {
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
      console.error('Error during logout:', error);
    } finally {
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        const response = await axios.put(API_ENDPOINTS.USERS.PROFILE, userData);
        setUser({ ...user, ...response.data });
      } catch (error) {
        console.error('Error updating user:', error);
        setError(error instanceof Error ? error.message : 'Failed to update user');
      }
    }
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