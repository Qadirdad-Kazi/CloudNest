import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  User,
  LogOut,
  Settings,
  HelpCircle,
  X,
  Check,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, darkMode, toggleDarkMode }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead, deleteAllRead } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning' | 'info') => {
    switch (type) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleClearRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAllRead();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
  };
  
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4">
      <div className="flex-1 max-w-2xl">
        <form onSubmit={handleSearchSubmit}>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="search"
              className="w-full p-2 pl-10 text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-600"
              placeholder="Search files and folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          onClick={toggleDarkMode}
        >
          {darkMode ? (
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        <div className="relative" ref={notificationsRef}>
          <button 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-20">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <h3 className="text-sm font-medium">Notifications</h3>
                <div className="flex space-x-2">
                  <button 
                    key="mark-all-read"
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={handleMarkAllRead}
                  >
                    Mark all as read
                  </button>
                  <button 
                    key="clear-read"
                    className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    onClick={handleClearRead}
                  >
                    Clear all read
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={(e) => handleNotificationClick(e, notification.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="ml-3 flex-1">
                          {notification.title && (
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {notification.title}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="relative" ref={userMenuRef}>
          <button 
            className="flex items-center space-x-2"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
              {user?.name.charAt(0) || 'U'}
            </div>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 py-1 z-10">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
              </div>
              
              <ul>
                <li key="profile">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
                    onClick={() => handleNavigate('/profile')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </button>
                </li>
                <li key="settings">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center"
                    onClick={() => handleNavigate('/settings')}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                </li>
                <li key="help">
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </button>
                </li>
                <li key="logout" className="border-t border-gray-200 dark:border-gray-800">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center text-red-600"
                    onClick={logout}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;