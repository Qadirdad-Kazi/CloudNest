import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial notifications and set up polling for unread count
  useEffect(() => {
    loadNotifications();
    const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async (page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationService.getNotifications(page);
      if (page === 1) {
        // Ensure we're setting an array
        setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);
      } else {
        setNotifications(prev => {
          // Ensure prev is always an array
          const prevArray = Array.isArray(prev) ? prev : [];
          // Ensure response.notifications is always an array
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
          // Ensure prev is always an array
          const prevArray = Array.isArray(prev) ? prev : [];
          
          // Find the index of the notification to update
          const index = prevArray.findIndex(n => n.id === notification.id);
          
          if (index !== -1) {
            // Create a copy of the array
            const updatedNotifications = [...prevArray];
            
            // Update the notification at the found index
            updatedNotifications[index] = {
              ...prevArray[index],
              ...notification,
              read: false, // Mark as unread when updated
            };
            
            return updatedNotifications;
          }
          
          // If not found, add as new
          const newNotification: Notification = {
            id: notification.id as string, // We know it's defined because isUpdate is true
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
          // Auto remove notification from UI after duration
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== notification.id));
          }, 5000); // Default duration is 5 seconds
        }
      } else {
        // Try to call the API for new notifications
        try {
          const newNotification = await notificationService.createNotification(notification);
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Auto remove notification from UI after duration
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
          }, 5000); // Default duration is 5 seconds
        } catch (apiError) {
          console.warn('API endpoint not available, using local notification');
          
          // Create a mock notification as fallback
          const mockNotification: Notification = {
            id: `local-${Date.now()}`,
            read: false,
            createdAt: new Date().toISOString(),
            type: notification.type,
            message: notification.message,
            title: notification.title,
            progress: notification.progress,
            relatedItemId: notification.relatedItemId,
            relatedItemType: notification.relatedItemType
          };
          
          // Add the mock notification to the UI
          setNotifications(prev => {
            // Ensure prev is always an array
            const prevArray = Array.isArray(prev) ? prev : [];
            return [mockNotification, ...prevArray];
          });
          setUnreadCount(prev => prev + 1);
          
          // Don't auto-remove progress notifications
          if (notification.progress === undefined || notification.progress === 100) {
            // Auto remove notification from UI after duration
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== mockNotification.id));
            }, 5000); // Default duration is 5 seconds
          }
        }
      }
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => {
        // Ensure prev is always an array
        const prevArray = Array.isArray(prev) ? prev : [];
        return prevArray.filter(notification => notification.id !== id);
      });
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