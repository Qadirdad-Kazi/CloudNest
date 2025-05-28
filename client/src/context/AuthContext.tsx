import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  settings: {
    notifications: {
      email: boolean;
      push: boolean;
      updates: boolean;
    };
    privacy: {
      publicProfile: boolean;
      showActivity: boolean;
      shareStats: boolean;
    };
    security: {
      twoFactor: boolean;
      loginAlerts: boolean;
      deviceHistory: boolean;
    };
    appearance: {
      darkMode: boolean;
      compactView: boolean;
      showThumbnails: boolean;
    };
    language: string;
  };
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/auth/login', { email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<User> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/auth/register', { name, email, password });
      const userData = response.data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to register';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        error,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};