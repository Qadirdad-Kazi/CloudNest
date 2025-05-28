import React, { createContext, useContext, useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  read?: boolean;
  relatedItemId?: string;
  relatedItemType?: 'file' | 'folder' | 'share' | 'storage';
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
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
        setNotifications(response.notifications);
      } else {
        setNotifications(prev => [...prev, ...response.notifications]);
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

  const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    try {
      // Try to call the API
      const newNotification = await notificationService.createNotification(notification);
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Auto remove notification from UI after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000); // Default duration is 5 seconds
    } catch (error) {
      console.warn('API endpoint not available, using local notification');
      
      // Create a mock notification as fallback
      const mockNotification: Notification = {
        id: `local-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
        ...notification
      };
      
      // Add the mock notification to the UI
      setNotifications(prev => [mockNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Auto remove notification from UI after duration
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== mockNotification.id));
      }, 5000); // Default duration is 5 seconds
    }
  };

  const removeNotification = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(notification => notification.id !== id));
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
      const updatedNotification = await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? updatedNotification : notification
        )
      );
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
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
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
      setNotifications(prev => prev.filter(notification => !notification.read));
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