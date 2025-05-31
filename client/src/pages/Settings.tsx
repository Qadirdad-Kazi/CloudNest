import React, { useState, useEffect } from 'react';
import { Bell, Shield, Moon, Sun, Globe, Key, Trash2, Save, RotateCcw } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useDarkMode } from '../contexts/DarkModeContext';
import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import axios from '../utils/axios';

interface NotificationSettings {
  email: boolean;
  push: boolean;
  updates: boolean;
}

interface PrivacySettings {
  publicProfile: boolean;
  showActivity: boolean;
  shareStats: boolean;
}

interface SecuritySettings {
  twoFactor: boolean;
  loginAlerts: boolean;
  deviceHistory: boolean;
}

interface AppearanceSettings {
  darkMode: boolean;
  compactView: boolean;
  showThumbnails: boolean;
}

interface PasswordSettings {
  current: string;
  new: string;
  confirm: string;
}

interface UserSettings {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  security: SecuritySettings;
  appearance: AppearanceSettings;
  language: string;
  password: PasswordSettings;
}

const Settings: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { addNotification } = useNotifications();
  const { darkMode, setDarkMode } = useDarkMode();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      updates: false,
    },
    privacy: {
      publicProfile: false,
      showActivity: true,
      shareStats: false,
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      deviceHistory: true,
    },
    appearance: {
      darkMode: darkMode,
      compactView: false,
      showThumbnails: true,
    },
    language: 'en',
    password: {
      current: '',
      new: '',
      confirm: '',
    }
  });

  // Load initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}`);
        setSettings(prev => ({
          ...prev,
          ...response.data,
          password: prev.password // Preserve password form state
        }));
        setDarkMode(response.data.appearance.darkMode);
      } catch (err) {
        console.error('Error loading settings:', err);
        setError('Failed to load settings');
        addNotification({
          type: 'error',
          message: 'Failed to load settings'
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []); // Empty dependency array since we only want to load settings once

  const handleToggle = (category: keyof UserSettings, setting: string) => {
    setSettings(prev => {
      const newSettings = { ...prev };
      const categorySettings = newSettings[category];
      
      if (categorySettings && typeof categorySettings === 'object' && setting in categorySettings) {
        const updatedCategorySettings = { ...categorySettings };
        (updatedCategorySettings as any)[setting] = !(updatedCategorySettings as any)[setting];
        (newSettings[category] as any) = updatedCategorySettings;

        // Special handling for dark mode
        if (category === 'appearance' && setting === 'darkMode') {
          const newDarkMode = (updatedCategorySettings as any)[setting];
          setDarkMode(newDarkMode);
        }
      }
      
      return newSettings;
    });

    // Save settings immediately after toggle
    handleSettingsSave().catch(error => {
      console.error('Failed to save settings:', error);
      addNotification({
        type: 'error',
        message: 'Failed to save settings'
      });
    });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.password.new !== settings.password.confirm) {
      setError('New passwords do not match');
      addNotification({
        type: 'error',
        message: 'New passwords do not match'
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await axios.put(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.RESET_PASSWORD}`, {
        currentPassword: settings.password.current,
        newPassword: settings.password.new
      });
      setSuccess('Password updated successfully');
      addNotification({
        type: 'success',
        message: 'Password updated successfully'
      });
      setSettings(prev => ({
        ...prev,
        password: { current: '', new: '', confirm: '' }
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update password';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.put(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}`, {
        notifications: settings.notifications,
        privacy: settings.privacy,
        security: settings.security,
        appearance: settings.appearance,
        language: settings.language
      });
      
      if (user) {
        updateUser({ ...user, settings: response.data });
      }
      
      setSuccess('Settings saved successfully');
      addNotification({
        type: 'success',
        message: 'Settings saved successfully'
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save settings';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultSettings: UserSettings = {
    notifications: {
      email: true,
      push: true,
      updates: false,
    },
    privacy: {
      publicProfile: false,
      showActivity: true,
      shareStats: false,
    },
    security: {
      twoFactor: false,
      loginAlerts: true,
      deviceHistory: true,
    },
    appearance: {
      darkMode: false,
      compactView: false,
      showThumbnails: true,
    },
    language: 'en',
    password: {
      current: '',
      new: '',
      confirm: '',
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      try {
        setLoading(true);
        setError(null);
        
        // First try to reset on the server
        try {
          await axios.post(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}/reset`);
        } catch (err) {
          console.warn('Server reset failed, falling back to default settings:', err);
        }

        // Reset to default settings locally
        setSettings(prev => ({
          ...defaultSettings,
          password: prev.password // Preserve password form state
        }));

        // Reset dark mode
        const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(systemDarkMode);

        // Save the default settings to the server
        await axios.put(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.SETTINGS}`, {
          notifications: defaultSettings.notifications,
          privacy: defaultSettings.privacy,
          security: defaultSettings.security,
          appearance: {
            ...defaultSettings.appearance,
            darkMode: systemDarkMode
          },
          language: defaultSettings.language
        });

        setSuccess('Settings reset successfully');
        addNotification({
          type: 'success',
          message: 'Settings reset successfully'
        });
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to reset settings';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setLoading(true);
        await axios.delete(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.USERS.PROFILE}`);
        addNotification({
          type: 'success',
          message: 'Account deleted successfully'
        });
        logout();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Failed to delete account';
        setError(errorMessage);
        addNotification({
          type: 'error',
          message: errorMessage
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <div className="fixed inset-y-0 left-0 z-30 w-64 transition-transform duration-300 ease-in-out transform md:relative md:translate-x-0">
        <Sidebar activeItem="settings" />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={() => {}} 
          darkMode={darkMode}
          toggleDarkMode={() => {
            const newDarkMode = !darkMode;
            setDarkMode(newDarkMode);
            setSettings(prev => ({
              ...prev,
              appearance: {
                ...prev.appearance,
                darkMode: newDarkMode
              }
            }));
            handleSettingsSave().catch(console.error);
          }}
        />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header with action buttons */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Settings</h1>
              <div className="flex space-x-4">
                <button
                  onClick={handleResetSettings}
                  className="flex items-center px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors duration-200"
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </button>
                <button
                  onClick={handleSettingsSave}
                  className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors duration-200"
                  disabled={loading}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </div>
            )}
            
            {success && (
              <div className="p-4 bg-green-100 dark:bg-green-900/50 border border-green-400 dark:border-green-800 text-green-700 dark:text-green-200 rounded-lg">
                <div className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  {success}
                </div>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              </div>
            )}

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Notifications Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 text-indigo-500 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={() => handleToggle('notifications', key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Shield className="w-5 h-5 text-indigo-500 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Privacy
                    </h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.privacy).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={() => handleToggle('privacy', key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Security Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Key className="w-5 h-5 text-indigo-500 mr-2" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Security
                    </h2>
                  </div>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={settings.password.current}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        password: { ...prev.password, current: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={settings.password.new}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        password: { ...prev.password, new: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={settings.password.confirm}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        password: { ...prev.password, confirm: e.target.value }
                      }))}
                      className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading || !settings.password.current || !settings.password.new || !settings.password.confirm}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>

                <div className="space-y-4">
                  {Object.entries(settings.security).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={() => handleToggle('security', key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {darkMode ? (
                      <Moon className="w-5 h-5 text-indigo-500 mr-2" />
                    ) : (
                      <Sun className="w-5 h-5 text-indigo-500 mr-2" />
                    )}
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Appearance
                    </h2>
                  </div>
                </div>
                <div className="space-y-4">
                  {Object.entries(settings.appearance).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <span className="text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={value}
                          onChange={() => handleToggle('appearance', key)}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 border-t-4 border-red-500">
              <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">Danger Zone</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Delete Account</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                  </div>
                  <button
                    onClick={handleDeleteAccount}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    <div className="flex items-center">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Settings; 