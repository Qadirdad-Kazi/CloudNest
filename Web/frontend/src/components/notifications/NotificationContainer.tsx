import React, { useMemo } from 'react';
import { useNotifications, Notification } from '../../context/NotificationContext';
import NotificationToast from './NotificationToast';

const NotificationContainer: React.FC = () => {
  const { notifications = [], removeNotification } = useNotifications();
  
  // Filter out any undefined or duplicate notifications
  const validNotifications = useMemo(() => {
    // Filter out undefined notifications
    const filtered = notifications.filter((n): n is Notification => {
      return n !== undefined && n !== null && typeof n.id === 'string' && n.id.length > 0;
    });
    
    // Remove duplicates by ID
    const uniqueMap = new Map<string, Notification>();
    filtered.forEach(notification => {
      uniqueMap.set(notification.id, notification);
    });
    
    return Array.from(uniqueMap.values());
  }, [notifications]);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {validNotifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );
};

export default NotificationContainer; 