import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all notifications for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
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
router.post('/read/:id', async (req, res) => {
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
router.post('/read/all', async (req, res) => {
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

export default router;