const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
  getUnreadCount,
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authenticate);

// Get notifications
router.get('/', getUserNotifications);

// Get unread notification count
router.get('/unread/count', getUnreadCount);

// Create a new notification
router.post('/', createNotification);

// Mark notification as read
router.patch('/:notificationId/read', markAsRead);

// Mark all notifications as read
router.patch('/read/all', markAllAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Delete all read notifications
router.delete('/read/all', deleteAllRead);

module.exports = router; 