import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from user settings only when authenticated
    const loadThemePreference = async () => {
      if (!currentUser) {
        // Use system preference or default to light mode when not authenticated
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
        return;
      }

      try {
        const response = await axios.get(API_ENDPOINTS.USERS.SETTINGS);
        setDarkMode(response.data.appearance?.darkMode ?? false);
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to system preference on error
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
      }
    };

    loadThemePreference();
  }, [currentUser]);

  const toggleDarkMode = async () => {
    try {
      // Only update the theme in the database if authenticated
      if (currentUser) {
        await axios.put(API_ENDPOINTS.USERS.SETTINGS, {
          appearance: { darkMode: !darkMode }
        });
      }
      
      // Update local state
      setDarkMode(!darkMode);
      
      // Apply theme to document
      document.documentElement.classList.toggle('dark', !darkMode);
    } catch (error) {
      console.error('Error updating theme preference:', error);
    }
  };

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
