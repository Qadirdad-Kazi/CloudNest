import Notification from '../models/Notification.js';
import websocketService from './websocketService.js';

/**
 * Notification Service
 * Handles creating and broadcasting notifications
 */

class NotificationService {
  /**
   * Create and broadcast a notification
   * @param {String} userId - User ID to send notification to
   * @param {Object} notificationData - Notification data
   * @returns {Object} Created notification
   */
  async createAndBroadcast(userId, notificationData) {
    try {
      // Create notification in database
      const notification = new Notification({
        userId,
        type: notificationData.type || 'info',
        title: notificationData.title,
        message: notificationData.message,
        relatedItemId: notificationData.relatedItemId,
        relatedItemType: notificationData.relatedItemType,
        read: false
      });

      await notification.save();

      // Broadcast via WebSocket for real-time delivery
      websocketService.broadcastNotification(userId.toString(), {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt,
        relatedItemId: notification.relatedItemId,
        relatedItemType: notification.relatedItemType
      });

      console.log(`✅ Notification created and broadcast to user ${userId}`);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send file upload success notification
   */
  async notifyFileUploaded(userId, fileName, fileSize) {
    return this.createAndBroadcast(userId, {
      type: 'success',
      title: 'File Uploaded',
      message: `${fileName} (${this.formatBytes(fileSize)}) has been uploaded successfully`,
      relatedItemType: 'file'
    });
  }

  /**
   * Send file delete notification
   */
  async notifyFileDeleted(userId, fileName) {
    return this.createAndBroadcast(userId, {
      type: 'info',
      title: 'File Deleted',
      message: `${fileName} has been deleted`,
      relatedItemType: 'file'
    });
  }

  /**
   * Send storage warning notification
   */
  async notifyStorageWarning(userId, remainingStorage, isNearlyFull, isCriticallyFull) {
    const type = isCriticallyFull ? 'error' : 'warning';
    const title = isCriticallyFull ? 'Storage Critical' : 'Storage Warning';
    const message = isCriticallyFull
      ? `Storage critically full! Only ${this.formatBytes(remainingStorage)} remaining.`
      : `Storage is getting full. Only ${this.formatBytes(remainingStorage)} remaining.`;

    return this.createAndBroadcast(userId, {
      type,
      title,
      message,
      relatedItemType: 'storage'
    });
  }

  /**
   * Send file shared notification
   */
  async notifyFileShared(userId, fileName, shareLink) {
    return this.createAndBroadcast(userId, {
      type: 'success',
      title: 'File Shared',
      message: `${fileName} has been shared successfully`,
      relatedItemType: 'share'
    });
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export default new NotificationService();

