import React from 'react';
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
  Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
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
  onItemClick: (item: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const storageUsed = user ? Math.round((user.storageUsed / user.storageLimit) * 100) : 0;
  
  // Convert bytes to appropriate unit
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <div className="w-64 h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      <div className="p-4 flex items-center">
        <Cloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-2" />
        <h1 className="text-xl font-bold">CloudDrive</h1>
      </div>
      
      <div className="p-4">
        <button 
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-indigo-700"
          onClick={() => {}}
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <SidebarItem 
          icon={<HardDrive className="w-5 h-5" />} 
          label="My Drive" 
          active={activeItem === 'my-drive'}
          onClick={() => onItemClick('my-drive')}
        />
        <SidebarItem 
          icon={<Star className="w-5 h-5" />} 
          label="Starred" 
          active={activeItem === 'starred'}
          onClick={() => onItemClick('starred')}
        />
        <SidebarItem 
          icon={<Share2 className="w-5 h-5" />} 
          label="Shared" 
          active={activeItem === 'shared'}
          onClick={() => onItemClick('shared')}
        />
        <SidebarItem 
          icon={<Clock className="w-5 h-5" />} 
          label="Recent" 
          active={activeItem === 'recent'}
          onClick={() => onItemClick('recent')}
        />
        <SidebarItem 
          icon={<Trash2 className="w-5 h-5" />} 
          label="Trash" 
          active={activeItem === 'trash'}
          onClick={() => onItemClick('trash')}
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
              active={activeItem === 'users'}
              onClick={() => onItemClick('users')}
            />
            <SidebarItem 
              icon={<BarChart className="w-5 h-5" />} 
              label="Analytics" 
              active={activeItem === 'analytics'}
              onClick={() => onItemClick('analytics')}
            />
            <SidebarItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              active={activeItem === 'settings'}
              onClick={() => onItemClick('settings')}
            />
          </>
        )}
      </div>
      
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Storage</span>
            <span className="font-medium">
              {user ? `${formatBytes(user.storageUsed)} / ${formatBytes(user.storageLimit)}` : '0 / 0'}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full"
              style={{ width: `${storageUsed}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;