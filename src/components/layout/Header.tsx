import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Moon, 
  Sun, 
  User,
  LogOut,
  Settings,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
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
        
        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 relative">
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
        </button>
        
        <div className="relative">
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
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                </li>
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center">
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Help & Support
                  </button>
                </li>
                <li className="border-t border-gray-200 dark:border-gray-800">
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