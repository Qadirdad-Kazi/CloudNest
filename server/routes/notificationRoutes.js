import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create a new notification
router.post('/', async (req, res) => {
  try {
    const { message, type } = req.body;
    
    if (!message || !type) {
      return res.status(400).json({ message: 'Message and type are required' });
    }
    
    const notification = new Notification({
      userId: req.user._id,
      message,
      type,
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
});

// Get all notifications for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [notifications, totalCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Notification.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.json({
      notifications,
      currentPage: parseInt(page),
      totalPages,
      totalNotifications: totalCount
    });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

// Get unread notifications count
router.get('/unread', async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread notifications count:', error);
    res.status(500).json({ message: 'Failed to get unread notifications count' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read/all', async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Delete a notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const notification = await Notification.findOneAndDelete({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// Delete all read notifications
router.delete('/read/all', async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ userId, read: true });
    res.json({ message: 'All read notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ message: 'Failed to delete read notifications' });
  }
});

export default router;