import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

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
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Load theme preference from user settings
    const loadThemePreference = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.USERS.SETTINGS);
        setDarkMode(response.data.appearance?.darkMode ?? false);
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Default to light mode on error
        setDarkMode(false);
      }
    };

    loadThemePreference();
  }, []);

  const toggleDarkMode = async () => {
    try {
      // Update the theme in the database
      await axios.put(API_ENDPOINTS.USERS.SETTINGS, {
        appearance: { darkMode: !darkMode }
      });
      
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
