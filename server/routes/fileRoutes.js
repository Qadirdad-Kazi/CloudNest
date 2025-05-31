import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { fileService } from '../services/fileService.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Set up multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10485760, // 10MB default
    files: 1
  }
}).single('file');

// Get files in a directory
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const path = req.query.path || '/';
    
    const files = await fileService.getFiles(userId, path);
    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
});

// Get recent files
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user._id;
    const days = parseInt(req.query.days) || 7;
    
    const files = await fileService.getRecentFiles(userId, days);
    res.json(files);
  } catch (error) {
    console.error('Error getting recent files:', error);
    res.status(500).json({ message: 'Failed to get recent files' });
  }
});

// Upload file
router.post('/upload', upload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user._id;
    const parentPath = req.body.path || '/';
    
    const file = await fileService.uploadFile(userId, req.file, parentPath);
    res.status(201).json(file);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: error.message || 'Failed to upload file' });
  }
});

// Move file to trash
router.post('/trash/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    
    const file = await fileService.moveToTrash(userId, fileId);
    res.json(file);
  } catch (error) {
    console.error('Error moving file to trash:', error);
    res.status(500).json({ message: error.message || 'Failed to move file to trash' });
  }
});

// Get files in trash
router.get('/trash', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const files = await fileService.getTrashFiles(userId);
    res.json(files);
  } catch (error) {
    console.error('Error getting trash files:', error);
    res.status(500).json({ message: 'Failed to get trash files' });
  }
});

// Restore file from trash
router.post('/restore/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    
    const file = await fileService.restoreFromTrash(userId, fileId);
    res.json(file);
  } catch (error) {
    console.error('Error restoring file:', error);
    res.status(500).json({ message: error.message || 'Failed to restore file' });
  }
});

// Permanently delete file
router.delete('/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    
    await fileService.permanentlyDeleteFile(userId, fileId);
    res.json({ message: 'File permanently deleted' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: error.message || 'Failed to delete file' });
  }
});

// Toggle star status
router.patch('/star/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    
    const file = await fileService.toggleStar(userId, fileId);
    res.json(file);
  } catch (error) {
    console.error('Error toggling star status:', error);
    res.status(500).json({ message: error.message || 'Failed to update star status' });
  }
});

export default router;