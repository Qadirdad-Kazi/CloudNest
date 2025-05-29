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

// Sanitize filename to prevent path traversal attacks
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace any character that's not alphanumeric, underscore, dot, or hyphen
    .replace(/\.\./g, '_'); // Replace double dots to prevent directory traversal
};

const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = 'uploads/';
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Sanitize filename and use UUID to ensure uniqueness
      const sanitizedName = sanitizeFilename(file.originalname);
      cb(null, `${uuidv4()}-${sanitizedName}`);
    }
  }),
  limits: {
    fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10485760, // 10MB default
    files: 1 // Allow only one file per request
  },
  fileFilter: function (req, file, cb) {
    // Strict content type validation
    const allowedTypes = process.env.ALLOWED_FILE_TYPES ? 
      process.env.ALLOWED_FILE_TYPES.split(',') : 
      ['image/jpeg', 'image/png', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
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

    console.log(`Deleting file ${id}, permanent: ${permanent}, userId: ${userId}`);

    // Find the file
    const file = await File.findOne({ _id: id, userId });
    
    if (!file) {
      console.log(`File not found: ${id}`);
      return res.status(404).json({ message: 'File not found' });
    }

    if (permanent === 'true' || permanent === true) {
      console.log(`Permanently deleting file: ${id}`);
      // Permanently delete the file
      await File.deleteOne({ _id: id, userId });
      
      // In a production environment, you would also delete the actual file from cloud storage here
      console.log(`File permanently deleted: ${id}`);
      res.json({ message: 'File permanently deleted', fileId: id });
    } else {
      console.log(`Moving file to trash: ${id}`);
      // Move to trash
      file.isDeleted = true;
      file.deletedAt = new Date();
      await file.save();
      
      console.log(`File moved to trash: ${id}`);
      res.json({ message: 'File moved to trash', fileId: id });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

// Move a file to trash
router.patch('/:id/trash', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    console.log(`Moving file to trash: ${id}, userId: ${userId}`);

    // Find the file
    const file = await File.findOne({ _id: id, userId });
    
    if (!file) {
      console.log(`File not found: ${id}`);
      return res.status(404).json({ message: 'File not found' });
    }

    // Move to trash
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();
    
    console.log(`File moved to trash: ${id}`);
    res.json({ message: 'File moved to trash', fileId: id });
  } catch (error) {
    console.error('Error moving file to trash:', error);
    res.status(500).json({ message: 'Failed to move file to trash' });
  }
});

// Star/unstar a file
router.patch('/star/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    // Find the file by ID and user ID
    const file = await File.findOne({ _id: id, userId });
    
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Toggle the isStarred status
    file.isStarred = !file.isStarred;
    
    // Save the updated file to the database
    await file.save();
    
    // Return the updated file
    res.json({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      shared: file.shared || false,
      starred: file.isStarred,
      tags: file.tags || [],
      createdAt: file.createdAt,
      modifiedAt: file.updatedAt,
      owner: file.userId
    });
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
    
    console.log(`Fetching trash files for user: ${userId}`);
    
    // Find all files in trash for this user - ensure we're using toString() for proper comparison
    const trashedFiles = await File.find({ 
      userId: userId.toString(), 
      isDeleted: true 
    });
    
    console.log(`Found ${trashedFiles.length} files in trash`);
    console.log('Trash files:', trashedFiles);
    
    // Format the response
    const formattedFiles = trashedFiles.map(file => ({
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      parentPath: file.parentPath || '/',
      starred: file.isStarred,
      shared: false, // This would need to be determined by checking ShareLinks
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      owner: file.userId,
      inTrash: true,
      deletedAt: file.deletedAt,
      url: file.url
    }));
    
    console.log('Returning formatted trash files:', formattedFiles);
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
    
    console.log(`Attempting to move file to trash: ${fileId}, userId: ${userId}`);
    
    // Find the file and update its status
    const file = await File.findOne({ _id: fileId, userId: userId.toString() });
    
    if (!file) {
      console.log(`File not found: ${fileId}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    console.log(`File found: ${file.name}, current isDeleted status: ${file.isDeleted}`);
    
    // Update the file's trash status
    file.isDeleted = true;
    file.deletedAt = new Date();
    file.isArchived = false; // Ensure it's not archived
    
    // Save the updated file
    const updatedFile = await file.save();
    console.log('Updated file document:', updatedFile);
    
    // Verify the file was updated correctly
    const verifyFile = await File.findById(fileId);
    console.log(`Verification - File ${fileId} isDeleted status: ${verifyFile.isDeleted}`);
    
    console.log(`File successfully moved to trash: ${fileId}, ${file.name}`);
    res.json({ 
      message: 'File moved to trash', 
      fileId,
      file: {
        id: file._id,
        name: file.name,
        isDeleted: file.isDeleted,
        deletedAt: file.deletedAt
      }
    });
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
    
    console.log(`Attempting to restore file from trash: ${fileId}, userId: ${userId}`);
    
    // Find the file and update its status
    const file = await File.findOne({ _id: fileId, userId: userId.toString(), isDeleted: true });
    
    if (!file) {
      console.log(`File not found in trash: ${fileId}`);
      return res.status(404).json({ message: 'File not found in trash' });
    }
    
    console.log(`Found file to restore: ${file.name}, path: ${file.path}`);
    
    // Update the file's trash status
    file.isDeleted = false;
    file.deletedAt = null;
    file.isArchived = false; // Ensure it's not archived
    
    // Save the updated file
    const updatedFile = await file.save();
    console.log('Restored file document:', updatedFile);
    
    // Format the response with the file details
    const restoredFile = {
      id: file._id,
      name: file.name,
      type: file.type,
      size: file.size,
      path: file.path,
      parentPath: file.parentPath || '/',
      starred: file.isStarred,
      shared: false, // This would need to be determined by checking ShareLinks
      createdAt: file.createdAt,
      modifiedAt: file.modifiedAt,
      owner: file.userId,
      inTrash: false,
      deletedAt: null,
      url: file.url
    };
    
    console.log(`File successfully restored from trash: ${fileId}, ${file.name}`);
    res.json({ 
      message: 'File restored from trash', 
      fileId,
      file: restoredFile
    });
  } catch (error) {
    console.error('Error restoring file from trash:', error);
    res.status(500).json({ message: 'Failed to restore file from trash' });
  }
});

// Empty trash (permanently delete all files in trash)
router.delete('/trash/empty', async (req, res) => {
  try {
    const userId = req.user._id;
    
    console.log(`Emptying trash for user: ${userId}`);
    
    // Find all trashed files for this user
    const trashedFiles = await File.find({ userId: userId.toString(), isDeleted: true });
    
    console.log(`Found ${trashedFiles.length} files in trash to process`);
    
    if (trashedFiles.length === 0) {
      return res.json({ message: 'Trash is already empty' });
    }
    
    // Get the IDs of all files to be deleted for the response
    const deletedFileIds = trashedFiles.map(file => file._id.toString());
    
    // Permanently delete all trashed files as requested by the user
    await File.deleteMany({ userId: userId.toString(), isDeleted: true });
    
    console.log(`Permanently deleted ${trashedFiles.length} files from trash`);
    
    // In a production environment, you would also delete the actual files from cloud storage here
    
    res.json({ 
      message: 'Trash emptied successfully', 
      count: trashedFiles.length,
      deletedFileIds: deletedFileIds
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ message: 'Failed to empty trash' });
  }
});

export default router;