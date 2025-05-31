import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  read?: boolean;
  progress?: number;
  relatedItemId?: string;
  relatedItemType?: 'file' | 'folder' | 'share' | 'storage';
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: Partial<Notification> & { message: string; type: NotificationType }) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteAllRead: () => void;
  loadMoreNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  addNotification: () => {},
  removeNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  deleteAllRead: () => {},
  loadMoreNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications and set up polling for unread count
  useEffect(() => {
    if (currentUser) {
      loadNotifications();
      const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
      return () => clearInterval(interval);
    } else {
      // Clear notifications when not authenticated
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  const loadNotifications = async (page = 1) => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(page);
      if (page === 1) {
        setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);
      } else {
        setNotifications(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const newNotifications = Array.isArray(response?.notifications) ? response.notifications : [];
          return [...prevArray, ...newNotifications];
        });
      }
      setHasMore(response.currentPage < response.totalPages);
      setCurrentPage(response.currentPage);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const addNotification = async (notification: Partial<Notification> & { message: string; type: NotificationType }) => {
    try {
      // Check if this is an update to an existing notification
      const isUpdate = notification.id !== undefined;
      
      if (isUpdate) {
        // Update existing notification
        setNotifications(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          const index = prevArray.findIndex(n => n.id === notification.id);
          
          if (index !== -1) {
            const updatedNotifications = [...prevArray];
            updatedNotifications[index] = {
              ...prevArray[index],
              ...notification,
              read: false,
            };
            return updatedNotifications;
          }
          
          const newNotification: Notification = {
            id: notification.id as string,
            read: false,
            createdAt: notification.createdAt || new Date().toISOString(),
            type: notification.type,
            message: notification.message,
            title: notification.title,
            progress: notification.progress,
            relatedItemId: notification.relatedItemId,
            relatedItemType: notification.relatedItemType
          };
          
          return [newNotification, ...prevArray];
        });
        
        // Don't auto-remove progress notifications
        if (notification.progress === undefined || notification.progress === 100) {
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 5000);
        }
      } else {
        // Create a new notification
        try {
          const newNotification = await notificationService.createNotification(notification);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Auto remove notification after 5 seconds if it's not a progress notification
          if (notification.progress === undefined || notification.progress === 100) {
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
            }, 5000);
          }
        } catch (error) {
          console.warn('API endpoint not available, using local notification');
          
          // Create a local notification
          const localNotification: Notification = {
            id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
            read: false,
            createdAt: new Date().toISOString(),
            type: notification.type,
            message: notification.message,
            title: notification.title,
            progress: notification.progress,
            relatedItemId: notification.relatedItemId,
            relatedItemType: notification.relatedItemType
          };
          
          setNotifications(prev => [localNotification, ...prev]);
          setUnreadCount(prev => prev + 1);
          
          // Auto remove notification after 5 seconds if it's not a progress notification
          if (notification.progress === undefined || notification.progress === 100) {
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== localNotification.id));
            }, 5000);
          }
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      // Check if it's a local notification (starts with 'local-')
      const isLocalNotification = id.startsWith('local-');
      
      if (!isLocalNotification) {
        // Only try to delete from server if it's not a local notification
        try {
          await notificationService.deleteNotification(id);
        } catch (error) {
          console.warn('Failed to delete notification from server:', error);
        }
      }
      
      // Always update local state
      setNotifications(prev => {
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter(notification => notification.id !== id);
      });
      
      // Update unread count if needed
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      try {
        // Try to call the API
        const updatedNotification = await notificationService.markAsRead(id);
        setNotifications(prev => {
          // Ensure prev is always an array
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(notification =>
            notification.id === id ? updatedNotification : notification
          );
        });
      } catch (apiError) {
        // If API fails, update local state only
        console.warn('API endpoint not available, updating local state only');
        setNotifications(prev => {
          // Ensure prev is always an array
          const prevArray = Array.isArray(prev) ? prev : [];
          return prevArray.map(notification =>
            notification.id === id ? { 
              ...notification, 
              read: true 
            } : notification
          );
        });
      }
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Try to call the API, but handle 404 errors gracefully
      try {
        await notificationService.markAllAsRead();
      } catch (apiError) {
        // If it's a 404, we'll just update the UI without the API call
        console.warn('API endpoint not available, updating UI only');
      }
      
      // Update the UI regardless of API success
      setNotifications(prev => {
        // Ensure prev is always an array
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.map(notification => ({ ...notification, read: true }));
      });
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteAllRead = async () => {
    try {
      // Try to call the API, but handle 404 errors gracefully
      try {
        await notificationService.deleteAllRead();
      } catch (apiError) {
        // If it's a 404, we'll just update the UI without the API call
        console.warn('API endpoint not available, updating UI only');
      }
      
      // Update the UI regardless of API success
      setNotifications(prev => {
        // Ensure prev is always an array
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter(notification => !notification.read);
      });
    } catch (error) {
      console.error('Error deleting read notifications:', error);
    }
  };

  const loadMoreNotifications = () => {
    if (hasMore && !isLoading) {
      loadNotifications(currentPage + 1);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        error,
        addNotification,
        removeNotification,
        markAsRead,
        markAllAsRead,
        deleteAllRead,
        loadMoreNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}; 