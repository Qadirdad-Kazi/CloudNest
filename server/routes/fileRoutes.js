import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Placeholder route
router.get('/', (req, res) => {
  res.json({ message: 'File routes coming soon' });
});

export default router; 