import axios from '../utils/axios';
import { Notification } from '../context/NotificationContext';
import { API_ENDPOINTS } from '../config/api';

export interface NotificationResponse {
  notifications: Notification[];
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
}

export const notificationService = {
  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> {
    try {
      const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS.LIST, {
        params: { page, limit, unreadOnly },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw new Error('Failed to fetch notifications');
    }
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    try {
      const response = await axios.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD);
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw new Error('Failed to fetch unread count');
    }
  },

  // Create a new notification
  async createNotification(notification: { message: string; type: string; title?: string }): Promise<Notification> {
    try {
      const response = await axios.post(API_ENDPOINTS.NOTIFICATIONS.LIST, notification);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    try {
      const response = await axios.patch(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    try {
      await axios.patch(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/read/all`);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Failed to delete notification');
    }
  },

  // Delete all read notifications
  async deleteAllRead(): Promise<void> {
    try {
      await axios.delete(`${API_ENDPOINTS.NOTIFICATIONS.LIST}/read/all`);
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      throw new Error('Failed to delete read notifications');
    }
  }
}; 