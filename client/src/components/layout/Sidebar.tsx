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
  AlertTriangle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth, StorageInfo } from '../../contexts/AuthContext';
import { useFiles } from '../../context/FileContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  path?: string;
  active?: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, collapsed }) => {
  return (
    <div 
      className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        active 
          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <div className="w-6 h-6 mr-3 flex-shrink-0">{icon}</div>
      {!collapsed && <span className="font-medium truncate">{label}</span>}
    </div>
  );
};

interface SidebarProps {
  activeItem: string;
  onItemClick?: (item: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobile?: boolean;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeItem, 
  onItemClick, 
  collapsed = false,
  onToggleCollapse,
  isMobile = false,
  isMobileOpen = false,
  onMobileClose
}) => {
  const { user } = useAuth();
  const { storageUsed, storageLimit } = useFiles();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleUpload = () => {
    console.log('Upload clicked');
  };

  const handleItemClick = (path: string, item: string) => {
    navigate(path);
    onItemClick && onItemClick(item);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };
  
  const sidebarClasses = `
    ${isMobile 
      ? 'fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out' 
      : 'relative'
    }
    ${isMobile && !isMobileOpen ? '-translate-x-full' : ''}
    ${collapsed ? 'w-16' : 'w-64'} 
    h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
  `;

  const overlayClasses = `
    ${isMobile && isMobileOpen 
      ? 'fixed inset-0 bg-black bg-opacity-50 z-40' 
      : 'hidden'
    }
  `;
  
  return (
    <>
      {/* Mobile overlay */}
      {isMobile && (
        <div className={overlayClasses} onClick={onMobileClose} />
      )}
      
      <div className={sidebarClasses}>
        {/* Header */}
        <div className={`p-4 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
          {!collapsed && (
            <div className="flex items-center">
              <Cloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mr-2" />
              <h1 className="text-xl font-bold">CloudNest</h1>
            </div>
          )}
          {collapsed && (
            <Cloud className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          )}
          
          {/* Toggle button for desktop */}
          {!isMobile && onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
          
          {/* Close button for mobile */}
          {isMobile && onMobileClose && (
            <button
              onClick={onMobileClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Upload button */}
        <div className="p-4">
          <button 
            className={`w-full bg-indigo-600 text-white py-2 px-4 rounded-lg flex items-center justify-center font-medium transition-colors hover:bg-indigo-700 ${
              collapsed ? 'px-2' : ''
            }`}
            onClick={handleUpload}
            title={collapsed ? 'Upload' : undefined}
          >
            <Upload className="w-5 h-5" />
            {!collapsed && <span className="ml-2">Upload</span>}
          </button>
        </div>
        
        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto p-2">
          <SidebarItem 
            icon={<HardDrive className="w-5 h-5" />} 
            label="My Drive" 
            path="/dashboard"
            active={activeItem === 'dashboard' || location.pathname === '/dashboard'}
            onClick={() => handleItemClick('/dashboard', 'dashboard')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Star className="w-5 h-5" />} 
            label="Starred" 
            path="/starred"
            active={activeItem === 'starred' || location.pathname === '/starred'}
            onClick={() => handleItemClick('/starred', 'starred')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Share2 className="w-5 h-5" />} 
            label="Shared" 
            path="/shared"
            active={activeItem === 'shared' || location.pathname === '/shared'}
            onClick={() => handleItemClick('/shared', 'shared')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Clock className="w-5 h-5" />} 
            label="Recent" 
            path="/recent"
            active={activeItem === 'recent' || location.pathname === '/recent'}
            onClick={() => handleItemClick('/recent', 'recent')}
            collapsed={collapsed}
          />
          <SidebarItem 
            icon={<Trash2 className="w-5 h-5" />} 
            label="Trash" 
            path="/trash"
            active={activeItem === 'trash' || location.pathname === '/trash'}
            onClick={() => handleItemClick('/trash', 'trash')}
            collapsed={collapsed}
          />
          
          {isAdmin && (
            <div className={`mt-6 mb-2 ${collapsed ? 'text-center' : 'px-3'} text-xs font-semibold text-gray-500 uppercase`}>
              {!collapsed && 'Admin'}
            </div>
          )}
          
          {isAdmin && (
            <>
              <SidebarItem 
                icon={<Users className="w-5 h-5" />} 
                label="Users" 
                path="/admin/users"
                active={location.pathname === '/admin/users'}
                onClick={() => handleItemClick('/admin/users', 'users')}
                collapsed={collapsed}
              />
              <SidebarItem 
                icon={<BarChart className="w-5 h-5" />} 
                label="Analytics" 
                path="/admin/analytics"
                active={location.pathname === '/admin/analytics'}
                onClick={() => handleItemClick('/admin/analytics', 'analytics')}
                collapsed={collapsed}
              />
              <SidebarItem 
                icon={<Settings className="w-5 h-5" />} 
                label="Settings" 
                path="/admin/settings"
                active={location.pathname === '/admin/settings'}
                onClick={() => handleItemClick('/admin/settings', 'settings')}
                collapsed={collapsed}
              />
            </>
          )}
          
          <div className={`mt-6 mb-2 ${collapsed ? 'text-center' : 'px-3'} text-xs font-semibold text-gray-500 uppercase`}>
            {!collapsed && 'Help'}
          </div>
          
          <SidebarItem 
            icon={<MessageSquare className="w-5 h-5" />} 
            label="Suggestions" 
            path="/suggestions"
            active={activeItem === 'suggestions' || location.pathname === '/suggestions'}
            onClick={() => handleItemClick('/suggestions', 'suggestions')}
            collapsed={collapsed}
          />
        </div>
        
        {/* Storage section */}
        {!collapsed && (
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
        )}
      </div>
    </>
  );
};

export default Sidebar;