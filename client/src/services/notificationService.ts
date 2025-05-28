import axios from 'axios';
import { Notification } from '../types';

const API_URL = '/api/notifications';

export interface NotificationResponse {
  notifications: Notification[];
  currentPage: number;
  totalPages: number;
  totalNotifications: number;
}

export const notificationService = {
  // Get user notifications
  async getNotifications(page = 1, limit = 20, unreadOnly = false): Promise<NotificationResponse> {
    const response = await axios.get(API_URL, {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await axios.get(`${API_URL}/unread/count`);
    return response.data.count;
  },

  // Create a new notification
  async createNotification(notification: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Promise<Notification> {
    const response = await axios.post(API_URL, notification);
    return response.data;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await axios.patch(`${API_URL}/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await axios.patch(`${API_URL}/read/all`);
  },

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<void> {
    await axios.delete(`${API_URL}/${notificationId}`);
  },

  // Delete all read notifications
  async deleteAllRead(): Promise<void> {
    await axios.delete(`${API_URL}/read/all`);
  },
}; 