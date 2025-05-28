import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Info, 
  X 
} from 'lucide-react';
import { Notification, NotificationType } from '../../context/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const getIcon = (type: NotificationType) => {
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
  return (
    <div
      className={`flex items-start p-4 mb-2 rounded-lg border-l-4 shadow-lg ${getBackgroundColor(
        notification.type
      )} ${getBorderColor(notification.type)}`}
      role="alert"
    >
      <div className="flex-shrink-0">{getIcon(notification.type)}</div>
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
  );
};

export default NotificationToast; 