import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X,
  Upload
} from 'lucide-react';
import { Notification, NotificationType } from '../../context/NotificationContext';
import ProgressBar from '../ui/ProgressBar';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const getIcon = (type: NotificationType, isUpload: boolean = false) => {
  if (isUpload) {
    return <Upload className="w-5 h-5 text-blue-500" />;
  }
  
  switch (type) {
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'error':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning':
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    case 'info':
      return <Info className="w-5 h-5 text-blue-500" />;
  }
};

const getBackgroundColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20';
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20';
    case 'warning':
      return 'bg-yellow-50 dark:bg-yellow-900/20';
    case 'info':
      return 'bg-blue-50 dark:bg-blue-900/20';
  }
};

const getBorderColor = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return 'border-green-500';
    case 'error':
      return 'border-red-500';
    case 'warning':
      return 'border-yellow-500';
    case 'info':
      return 'border-blue-500';
  }
};

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onClose }) => {
  // Check if this is an upload notification with progress
  const isUploadNotification = notification.progress !== undefined;
  
  return (
    <div
      className={`flex flex-col p-4 mb-2 rounded-lg border-l-4 shadow-lg ${getBackgroundColor(
        notification.type
      )} ${getBorderColor(notification.type)}`}
      role="alert"
    >
      <div className="flex items-start w-full">
        <div className="flex-shrink-0">
          {getIcon(notification.type, isUploadNotification)}
        </div>
        <div className="ml-3 flex-1">
          {notification.title && (
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {notification.title}
            </h3>
          )}
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {notification.message}
          </div>
        </div>
        <button
          className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none"
          onClick={() => onClose(notification.id)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Show progress bar for upload notifications */}
      {isUploadNotification && (
        <div className="mt-2 w-full">
          <ProgressBar 
            progress={notification.progress || 0} 
            height={4}
            color={notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}
          />
          <div className="text-xs text-right mt-1 text-gray-500 dark:text-gray-400">
            {notification.progress}%
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationToast; 