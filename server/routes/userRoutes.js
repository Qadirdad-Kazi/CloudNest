import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getProfile,
  updateProfile,
  updatePassword,
  updateAvatar,
  updateSettings,
  getSettings,
  resetSettings,
  updateStats,
  getStorageInfo,
  deleteAccount
} from '../controllers/userController.js';
import User from '../models/User.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Avatar routes
router.post('/avatar', updateAvatar);

// Settings routes
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.post('/settings/reset', resetSettings);

// Password routes
router.put('/password', updatePassword);

// Stats routes
router.put('/stats', updateStats);

// Storage routes
router.get('/storage', getStorageInfo);

// Account deletion
router.delete('/account', deleteAccount);

// Get user settings
router.get('/settings', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('settings');
    res.json(user.settings || {});
  } catch (error) {
    console.error('Error getting user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user settings
router.put('/settings', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Merge existing settings with new settings
    user.settings = {
      ...user.settings,
      ...req.body
    };

    await user.save();
    res.json(user.settings);
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 