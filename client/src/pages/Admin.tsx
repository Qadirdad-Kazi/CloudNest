import React, { useState } from 'react';
import { BarChart3, Users, Activity, Settings, MessageSquare } from 'lucide-react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import UsersTable from '../components/admin/UsersTable';
import { useAuth } from '../contexts/AuthContext';
import { mockUsers, mockActivityLogs } from '../data/mockData';
import { User } from '../types';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [darkMode, setDarkMode] = useState(false);
  
  // Apply dark mode class to document
  React.useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You do not have permission to access the admin panel. 
            Please contact an administrator if you believe this is an error.
          </p>
          <button 
            className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
            onClick={() => window.history.back()}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  const handleEditUser = (user: User) => {
    console.log('Edit user:', user);
  };
  
  const handleDeleteUser = (user: User) => {
    console.log('Delete user:', user);
  };
  
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar activeItem="users" onItemClick={() => {}} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onSearch={() => {}} 
          darkMode={darkMode} 
          toggleDarkMode={() => setDarkMode(!darkMode)} 
        />
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage users, monitor system performance, and configure settings
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'users' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveTab('users')}
              >
                <Users className="w-4 h-4 mr-2" />
                Users
              </button>
              
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'analytics' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveTab('analytics')}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </button>
              
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'activity' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveTab('activity')}
              >
                <Activity className="w-4 h-4 mr-2" />
                Activity
              </button>
              
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'suggestions' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => window.location.href = '/admin/suggestions'}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Suggestions
              </button>
              
              <button 
                className={`py-3 px-4 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 'settings' 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-500' 
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => setActiveTab('settings')}
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
          
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">User Management</h2>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add User
                </button>
              </div>
              
              <UsersTable 
                users={mockUsers}
                onEditUser={handleEditUser}
                onDeleteUser={handleDeleteUser}
              />
            </div>
          )}
          
          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">System Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Users</h3>
                  <p className="text-3xl font-bold">{mockUsers.length}</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Total Storage Used</h3>
                  <p className="text-3xl font-bold">485 MB</p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Files Uploaded Today</h3>
                  <p className="text-3xl font-bold">12</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
                <h3 className="text-lg font-medium mb-4">Storage Usage Over Time</h3>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chart would go here</p>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium mb-4">User Activity Heatmap</h3>
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Chart would go here</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'activity' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Activity Logs</h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Action
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {mockActivityLogs.map(log => {
                      const user = mockUsers.find(u => u.id === log.userId);
                      
                      return (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium mr-3">
                                {user?.name.charAt(0) || '?'}
                              </div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user?.name || 'Unknown User'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full capitalize
                              ${log.action === 'upload' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                              log.action === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' : 
                              log.action === 'share' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'}"
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {log.details || (log.itemName ? `${log.action} ${log.itemName}` : '')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">System Settings</h2>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h3 className="text-lg font-medium mb-4">Storage Quotas</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Default storage for new users</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md mr-2 dark:bg-gray-700"
                        defaultValue="5"
                      />
                      <select className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700">
                        <option>GB</option>
                        <option>MB</option>
                        <option>TB</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum upload size</label>
                    <div className="flex items-center">
                      <input 
                        type="number" 
                        className="p-2 border border-gray-300 dark:border-gray-600 rounded-md mr-2 dark:bg-gray-700"
                        defaultValue="500"
                      />
                      <select className="p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700">
                        <option>MB</option>
                        <option>GB</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Public file sharing</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow users to share files publicly</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Password protection</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow password protection for shared files</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-factor authentication</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Require 2FA for all admin users</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Admin;