import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Camera, User } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { User as UserType } from '../contexts/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import AvatarSelector, { avatars } from '../components/AvatarSelector';
import axios from '../utils/axios';
import { API_ENDPOINTS } from '../config/api';

// Extended user interface for profile page
interface ExtendedUser extends UserType {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvatarSelectorOpen, setIsAvatarSelectorOpen] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as ExtendedUser)?.phone || '',
    address: (user as ExtendedUser)?.address || '',
    avatar: (user as ExtendedUser)?.avatar || 'avatar1'
  });
  const { addNotification } = useNotifications();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = async (avatarId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(API_ENDPOINTS.USERS.AVATAR, { avatarId });
      
      if (response.data && response.data.user) {
        setProfileData(prev => ({
          ...prev,
          avatar: response.data.user.avatar
        }));
        
        // Update the global user context with the new avatar
        updateUser({
          ...user,
          avatar: response.data.user.avatar
        });
        
        addNotification({
          type: 'success',
          message: 'Avatar updated successfully'
        });
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      console.error('Avatar update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update avatar';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
      setIsAvatarSelectorOpen(false);
    }
  };

  // Get the current avatar URL
  const getCurrentAvatarUrl = () => {
    if (!profileData.avatar) return avatars[0].url;
    const avatarId = profileData.avatar.replace('avatar', '');
    const avatarMap: { [key: string]: string } = {
      '1': 'boy1.png',
      '2': 'boy2.png',
      '3': 'doctor.png',
      '4': 'girl.png',
      '5': 'man.png',
      '6': 'woman.png'
    };
    return `/avatars/${avatarMap[avatarId] || 'boy1.png'}`;
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.put(API_ENDPOINTS.USERS.PROFILE, profileData);
      
      if (response.data && response.data.user) {
        updateUser(response.data.user);
        setIsEditing(false);
        addNotification({
          type: 'success',
          message: 'Profile updated successfully'
        });
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err: any) {
      console.error('Profile update error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
      addNotification({
        type: 'error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: (user as ExtendedUser)?.phone || '',
      address: (user as ExtendedUser)?.address || '',
      avatar: (user as ExtendedUser)?.avatar || 'avatar1'
    });
    setIsEditing(false);
    setError(null);
  };

  // Update profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: (user as ExtendedUser)?.phone || '',
        address: (user as ExtendedUser)?.address || '',
        avatar: (user as ExtendedUser)?.avatar || 'avatar1'
      });
    }
  }, [user]);

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Profile</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 mb-6">
              <div className="relative">
                <img
                  src={getCurrentAvatarUrl()}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => setIsAvatarSelectorOpen(true)}
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                  disabled={loading}
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profileData.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{profileData.email}</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Phone className="w-4 h-4 inline mr-2" />
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleInputChange}
                    disabled={!isEditing || loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : null}
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Statistics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {(user as ExtendedUser)?.filesCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {((user as ExtendedUser)?.storageUsed || 0) > 0 
                  ? `${Math.round(((user as ExtendedUser)?.storageUsed || 0) / (1024 * 1024 * 1024) * 100) / 100} GB`
                  : '0 GB'
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Storage Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Member Since</div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Selector Modal */}
      {isAvatarSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose Avatar</h3>
            <AvatarSelector
              onSelect={handleAvatarChange}
              onClose={() => setIsAvatarSelectorOpen(false)}
            />
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Profile; 