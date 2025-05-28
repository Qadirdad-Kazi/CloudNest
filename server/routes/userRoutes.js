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
  deleteAccount
} from '../controllers/userController.js';

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

// Account deletion
router.delete('/account', deleteAccount);

export default router; 