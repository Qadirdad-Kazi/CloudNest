import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Camera } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../contexts/AuthContext';
import axios from 'axios';

// Extended user interface for profile page
interface ExtendedUser extends User {
  phone?: string;
  address?: string;
  avatar?: string;
  storageUsed?: number;
  filesCount?: number;
  createdAt?: string;
}

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize dark mode from localStorage or system preference
    const savedDarkMode = localStorage.getItem('darkMode');
    return savedDarkMode ? JSON.parse(savedDarkMode) : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Apply dark mode class to HTML element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as ExtendedUser)?.phone || '',
    address: (user as ExtendedUser)?.address || '',
    avatar: (user as ExtendedUser)?.avatar || ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/users/avatar', formData);
      setProfileData(prev => ({
        ...prev,
        avatar: response.data.avatarUrl
      }));
      // Cast to ensure TypeScript knows we can add avatar property
      updateUser({ ...user, avatar: response.data.avatarUrl } as Partial<User>);
    } catch (err) {
      setError('Failed to upload avatar');
      console.error('Error uploading avatar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      try {
        // Try to call the API
        const response = await axios.put('/api/users/profile', profileData);
        updateUser(response.data);
      } catch (apiError) {
        // If API fails, update local state only
        console.warn('API endpoint not available, updating local state only');
        // Update the user data locally
        // Cast to ensure TypeScript knows we can add the profile properties
        updateUser({ ...user, ...profileData } as Partial<User>);
      }
      
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeItem="profile" onItemClick={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={() => {}} 
          darkMode={darkMode}
          toggleDarkMode={() => setDarkMode(!darkMode)}
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="relative h-48 rounded-t-lg bg-indigo-600">
              <div className="absolute -bottom-12 left-8">
                <div className="relative">
                  <img
                    src={profileData.avatar || '/default-avatar.png'}
                    alt="Profile"
                    className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-800"
                  />
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                      <Camera className="w-4 h-4 text-white" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-16 pb-8 px-8">
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isEditing ? 'Edit Profile' : 'Profile'}
                </h1>
                <button
                  onClick={(e) => isEditing ? handleSubmit(e) : setIsEditing(true)}
                  className={`px-4 py-2 rounded-md ${
                    isEditing
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  } text-white`}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span>{profileData.name}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Your name"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{profileData.name}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Mail className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Your email"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">{profileData.email}</p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <Phone className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Your phone number"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">
                      {profileData.phone || 'No phone number added'}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={profileData.address}
                      onChange={handleInputChange}
                      className="flex-1 p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Your address"
                    />
                  ) : (
                    <p className="text-gray-700 dark:text-gray-300">
                      {profileData.address || 'No address added'}
                    </p>
                  )}
                </div>
              </form>

              <div className="mt-8 pt-8 border-t dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Account Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Storage Used
                    </h3>
                    <div className="text-2xl font-bold">{(user as ExtendedUser)?.filesCount || 0}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Files Uploaded
                    </h3>
                    <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">
                      {(user as ExtendedUser)?.filesCount || 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Member Since
                    </h3>
                    <div className="text-sm text-gray-500">{new Date((user as ExtendedUser)?.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile; 