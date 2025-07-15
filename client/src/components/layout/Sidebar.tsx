import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HardDrive, 
  Star, 
  Share2, 
  Clock, 
  Trash2, 
  Cloud, 
  Upload,
  Users,
  BarChart,
  Settings,
  MessageSquare,
  AlertTriangle
} from 'lucide-react';
import { useAuth, StorageInfo } from '../../contexts/AuthContext';
import { useFiles } from '../../context/FileContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string; // Made optional since it's not being used
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <div 
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        active 
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="w-6 h-6 mr-3">{icon}</div>
      <span className="font-medium">{label}</span>
    </div>
  );
};

interface SidebarProps {
  activeItem: string;
  onItemClick?: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  const { user } = useAuth();
  const { storageUsed, storageLimit } = useFiles();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  
  // Default values
  // const storageUsed = storageInfo?.storageUsed || user?.storageUsed || 0;
  // const storageLimit = storageInfo?.storageLimit || user?.storageLimit || (5 * 1024 * 1024 * 1024); // 5GB default
  
  // Convert bytes to appropriate unit
  // Fetch storage information
  // useEffect(() => {
  //   const fetchStorageInfo = async () => {
  //     if (!user) return;
      
  //     setIsLoadingStorage(true);
  //     setStorageError(null);
      
  //     try {
  //       const info = await getStorageInfo();
  //       setStorageInfo(info);
  //     } catch (error) {
  //       console.error('Error fetching storage info:', error);
  //       setStorageError('Failed to load storage information');
  //     } finally {
  //       setIsLoadingStorage(false);
  //     }
  //   };
    
  //   fetchStorageInfo();
    
  //   // Refresh storage info every 5 minutes
  //   const intervalId = setInterval(fetchStorageInfo, 5 * 60 * 1000);
    
  //   return () => clearInterval(intervalId);
  // }, [user, getStorageInfo]);
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    // TODO: Implement upload functionality
    console.log('Upload clicked');
  };
  
  return (
    <div className="w-64 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 flex items-center">
        <Cloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-2" />
        <h1 className="text-xl font-bold">CloudNest</h1>
      </div>
      
      <div className="p-4">
        <button 
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-indigo-700"
          onClick={handleUpload}
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <SidebarItem 
          icon={<HardDrive className="w-5 h-5" />} 
          label="My Drive" 
          path="/dashboard"
          active={activeItem === 'dashboard' || location.pathname === '/dashboard'}
          onClick={() => {
            navigate('/dashboard');
            onItemClick && onItemClick('dashboard');
          }}
        />
        <SidebarItem 
          icon={<Star className="w-5 h-5" />} 
          label="Starred" 
          path="/starred"
          active={activeItem === 'starred' || location.pathname === '/starred'}
          onClick={() => {
            navigate('/starred');
            onItemClick && onItemClick('starred');
          }}
        />
        <SidebarItem 
          icon={<Share2 className="w-5 h-5" />} 
          label="Shared" 
          path="/shared"
          active={activeItem === 'shared' || location.pathname === '/shared'}
          onClick={() => {
            navigate('/shared');
            onItemClick && onItemClick('shared');
          }}
        />
        <SidebarItem 
          icon={<Clock className="w-5 h-5" />} 
          label="Recent" 
          path="/recent"
          active={activeItem === 'recent' || location.pathname === '/recent'}
          onClick={() => {
            navigate('/recent');
            onItemClick && onItemClick('recent');
          }}
        />
        <SidebarItem 
          icon={<Trash2 className="w-5 h-5" />} 
          label="Trash" 
          path="/trash"
          active={activeItem === 'trash' || location.pathname === '/trash'}
          onClick={() => {
            navigate('/trash');
            onItemClick && onItemClick('trash');
          }}
        />
        
        {isAdmin && (
          <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase">
            Admin
          </div>
        )}
        
        {isAdmin && (
          <>
            <SidebarItem 
              icon={<Users className="w-5 h-5" />} 
              label="Users" 
              path="/admin/users"
              active={location.pathname === '/admin/users'}
              onClick={() => navigate('/admin/users')}
            />
            <SidebarItem 
              icon={<BarChart className="w-5 h-5" />} 
              label="Analytics" 
              path="/admin/analytics"
              active={location.pathname === '/admin/analytics'}
              onClick={() => navigate('/admin/analytics')}
            />
            <SidebarItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              path="/admin/settings"
              active={location.pathname === '/admin/settings'}
              onClick={() => navigate('/admin/settings')}
            />
          </>
        )}
        
        <div className="mt-6 mb-2 px-3 text-xs font-semibold text-gray-500 uppercase">
          Help
        </div>
        
        <SidebarItem 
          icon={<MessageSquare className="w-5 h-5" />} 
          label="Suggestions" 
          path="/suggestions"
          active={activeItem === 'suggestions' || location.pathname === '/suggestions'}
          onClick={() => {
            navigate('/suggestions');
            onItemClick && onItemClick('suggestions');
          }}
        />
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Storage</span>
            <span className="font-medium">
              {`${formatBytes(storageUsed)} / ${formatBytes(storageLimit)}`}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${storageUsed / storageLimit > 0.95 ? 'bg-red-500' : storageUsed / storageLimit > 0.8 ? 'bg-yellow-500' : 'bg-indigo-600'}`}
              style={{ width: `${Math.min((storageUsed / storageLimit) * 100, 100)}%` }}
            />
          </div>
          <div className="text-xs text-center text-gray-500 dark:text-gray-400">
            {`${((storageUsed / storageLimit) * 100).toFixed(1)}% used`}
          </div>
          {/* Storage warning notification */}
          {(storageUsed / storageLimit > 0.95) && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Storage critically full! Less than {formatBytes(storageLimit - storageUsed)} remaining.
                  </p>
                </div>
              </div>
            </div>
          )}
          {(storageUsed / storageLimit > 0.8 && storageUsed / storageLimit <= 0.95) && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="ml-2">
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Storage is getting full. Only {formatBytes(storageLimit - storageUsed)} remaining.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;