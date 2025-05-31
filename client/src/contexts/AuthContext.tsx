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

  useEffect(() => {
    // Check if user is authenticated by making a request to the server
    const checkAuthStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          method: 'GET',
          credentials: 'include', // This ensures cookies are sent with the request
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Clear user if not authenticated
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are sent with the request
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to login');
      }

      const data = await response.json();
      
      // Update user state - the cookie is set by the server
      setUser(data);
      return data;
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This ensures cookies are sent with the request
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      
      // Update user state - the cookie is set by the server
      setUser(data);
    } catch (error: any) {
      setError(error.message || 'An error occurred during registration');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the server-side logout endpoint to clear the cookie
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear the user state regardless of server response
      setUser(null);
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    if (user) {
      try {
        // Call the server to update the user data
        const response = await fetch(`${API_URL}/auth/update-profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(userData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update user');
        }

        const updatedUserData = await response.json();
        setUser({ ...user, ...updatedUserData });
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