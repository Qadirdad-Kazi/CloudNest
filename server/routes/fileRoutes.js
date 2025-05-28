import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import File from '../models/File.js';

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${uuidv4()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10485760 // 10MB default
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only jpg, png, pdf, and txt files are allowed.'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// Get all files (non-trashed) for the current user at the specified path
router.get('/', async (req, res) => {
  try {
    const { path = '/' } = req.query;
    const userId = req.user._id;
    
    // Query the database for files that match the path and aren't deleted
    const files = await File.find({
      userId,
      parentPath: path,
      isDeleted: false
    }).sort({ modifiedAt: -1 });
    
    // Transform the database objects to match the expected client format
    const formattedFiles = files.map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      starred: file.isStarred,
      shared: false, // This would need to be determined by checking ShareLinks
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      owner: file.userId
    }));
    
    res.json(formattedFiles);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
});

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Determine file category based on mimetype
    const mimeType = req.file.mimetype;
    let category = 'others';
    
    if (mimeType.startsWith('image/')) {
      category = 'images';
    } else if (mimeType.startsWith('video/')) {
      category = 'videos';
    } else if (mimeType.startsWith('audio/')) {
      category = 'audio';
    } else if (['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'].includes(mimeType)) {
      category = 'documents';
    } else if (['application/zip', 'application/x-rar-compressed', 'application/x-tar'].includes(mimeType)) {
      category = 'archives';
    } else if (['application/javascript', 'text/html', 'text/css', 'application/json'].includes(mimeType)) {
      category = 'code';
    }

    // Create new file document in database
    const newFile = new File({
      userId: req.user._id,
      name: req.file.originalname,
      type: req.file.mimetype.split('/')[1],
      size: req.file.size,
      path: `${req.body.path || '/'}${req.file.originalname}`,
      parentPath: req.body.path || '/',
      category,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
    });

    await newFile.save();

    // Format response to match client expectations
    const fileResponse = {
      id: newFile._id,
      name: newFile.name,
      type: newFile.type,
      size: newFile.size,
      path: newFile.path,
      starred: newFile.isStarred,
      shared: false,
      createdAt: newFile.createdAt,
      modifiedAt: newFile.modifiedAt,
      owner: newFile.userId,
      url: newFile.url
    };

    res.status(201).json(fileResponse);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

// Delete a file (move to trash or permanent delete)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const userId = req.user._id;

    // Find the file
    const file = await File.findOne({ _id: id, userId });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (permanent === 'true' || permanent === true) {
      // Permanently delete the file
      await File.deleteOne({ _id: id, userId });
      
      // In a production environment, you would also delete the actual file from cloud storage here
      
      res.json({ message: 'File permanently deleted', fileId: id });
    } else {
      // Move to trash
      file.isDeleted = true;
      file.deletedAt = new Date();
      await file.save();
      
      res.json({ message: 'File moved to trash', fileId: id });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Star/unstar a file
router.patch('/star/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real implementation, you would toggle the starred status in the database
    
    res.json({ message: 'File star status updated' });
  } catch (error) {
    console.error('Error updating star status:', error);
    res.status(500).json({ message: 'Failed to update star status' });
  }
});

// Get recent files
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Query the database for recently accessed files (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentFiles = await File.find({
      userId,
      isDeleted: false,
      lastAccessed: { $gte: thirtyDaysAgo }
    })
    .sort({ lastAccessed: -1 })
    .limit(10);
    
    // Transform the database objects to match the expected client format
    const formattedFiles = recentFiles.map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      starred: file.isStarred,
      shared: false, // This would need to be determined by checking ShareLinks
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      owner: file.userId,
      url: file.url
    }));
    
    res.json(formattedFiles);
  } catch (error) {
    console.error('Error getting recent files:', error);
    res.status(500).json({ message: 'Failed to get recent files' });
  }
});

// Get files in trash
router.get('/trash', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Query the database for files that are marked as deleted
    const trashedFiles = await File.find({
      userId,
      isDeleted: true
    }).sort({ deletedAt: -1 });
    
    // Transform the database objects to match the expected client format
    const formattedFiles = trashedFiles.map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      starred: file.isStarred,
      shared: false, // This would need to be determined by checking ShareLinks
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      owner: file.userId,
      inTrash: true,
      deletedAt: file.deletedAt,
      url: file.url
    }));
    
    res.json(formattedFiles);
  } catch (error) {
    console.error('Error getting trash files:', error);
    res.status(500).json({ message: 'Failed to get trash files' });
  }
});

// Move a file to trash
router.post('/trash', async (req, res) => {
  try {
    const { fileId } = req.body;
    const userId = req.user._id;
    
    // Find the file and update its status
    const file = await File.findOne({ _id: fileId, userId });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Update the file's trash status
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();
    
    res.json({ message: 'File moved to trash', fileId });
  } catch (error) {
    console.error('Error moving file to trash:', error);
    res.status(500).json({ message: 'Failed to move file to trash' });
  }
});

// Restore a file from trash
router.post('/restore', async (req, res) => {
  try {
    const { fileId } = req.body;
    const userId = req.user._id;
    
    // Find the file and update its status
    const file = await File.findOne({ _id: fileId, userId, isDeleted: true });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found in trash' });
    }
    
    // Update the file's trash status
    file.isDeleted = false;
    file.deletedAt = null;
    await file.save();
    
    res.json({ message: 'File restored from trash', fileId });
  } catch (error) {
    console.error('Error restoring file from trash:', error);
    res.status(500).json({ message: 'Failed to restore file from trash' });
  }
});

// Empty trash (permanently delete all files in trash)
router.delete('/trash/empty', async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all trashed files for this user
    const trashedFiles = await File.find({ userId, isDeleted: true });
    
    if (trashedFiles.length === 0) {
      return res.json({ message: 'Trash is already empty' });
    }
    
    // Permanently delete all trashed files
    await File.deleteMany({ userId, isDeleted: true });
    
    // In a production environment, you would also delete the actual files from cloud storage here
    
    res.json({ 
      message: 'Trash emptied successfully', 
      count: trashedFiles.length 
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ message: 'Failed to empty trash' });
  }
});

export default router;