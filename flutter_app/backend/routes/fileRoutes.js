import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { fileService } from '../services/fileService.js';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import { File } from '../models/File.js';
import Folder from '../models/Folder.js';
import { bucket } from '../config/mongodb.js';

const router = express.Router();

// Debug endpoint to check Cloudinary configuration (remove in production)
router.get('/debug/cloudinary-config', authenticate, (req, res) => {
  const config = cloudinary.config();
  res.json({
    cloud_name: config.cloud_name || '❌ Missing',
    api_key: config.api_key ? '✅ Set' : '❌ Missing',
    api_secret: config.api_secret ? '✅ Set' : '❌ Missing',
    isConfigured: !!(config.cloud_name && config.api_key && config.api_secret)
  });
});

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

// Create file record (used for Cloudinary uploads)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, type, size, path, url, cloudProvider } = req.body;
    
    console.log('Creating file record with data:', req.body);
    
    // Determine file category based on file type
    let category = 'others';
    if (type.startsWith('image/')) category = 'images';
    else if (type.startsWith('video/')) category = 'videos';
    else if (type.startsWith('audio/')) category = 'audio';
    else if (type.includes('pdf') || type.includes('doc') || type.includes('sheet') || type.includes('presentation')) category = 'documents';
    else if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('gz')) category = 'archives';
    else if (type.includes('javascript') || type.includes('typescript') || type.includes('python') || type.includes('java') || type.includes('html') || type.includes('css')) category = 'code';
    
    // Use cloudId from client if provided, otherwise extract from URL
    let cloudId = req.body.cloudId || '';
    
    if (!cloudId) {
      // Fallback: Try to extract from URL if not provided
      if (cloudProvider === 'cloudinary' && url) {
        // Try to extract the public ID from the Cloudinary URL
        const matches = url.match(/\/v\d+\/([^\/\.]+)/);
        cloudId = matches && matches[1] ? matches[1] : `file_${Date.now()}`;
        console.log('⚠️ Warning: cloudId not provided, extracted from URL:', cloudId);
      } else {
        // For MongoDB, use the last part of the URL or generate a unique ID
        cloudId = url ? url.split('/').pop() : `file_${Date.now()}`;
      }
    } else {
      console.log('✅ Using cloudId from client:', cloudId);
    }
    
    // Create new file document
    const newFile = new File({
      userId,
      name,
      type,
      size,
      path,
      parentPath: path.split('/').slice(0, -1).join('/') || '/',
      category,
      url,
      cloudProvider,
      cloudId,
      isDeleted: false,
      isStarred: false,
      createdAt: new Date(),
      modifiedAt: new Date(),
      lastAccessed: new Date()
    });
    
    await newFile.save();
    console.log('File record created successfully:', newFile);
    
    // Return the file with formatted fields
    const formattedFile = {
      id: newFile._id,
      name: newFile.name,
      type: newFile.type,
      size: newFile.size,
      path: newFile.path,
      url: newFile.url,
      cloudProvider: newFile.cloudProvider,
      createdAt: newFile.createdAt,
      modifiedAt: newFile.modifiedAt,
      owner: newFile.userId,
      starred: newFile.isStarred,
      shared: false
    };
    
    res.status(201).json(formattedFile);
  } catch (error) {
    console.error('Error creating file record:', error);
    res.status(500).json({ message: error.message || 'Failed to create file record' });
  }
});

// Get recent files
router.get('/recent', authenticate, async (req, res) => {
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

// Get starred files
router.get('/starred', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    console.log(`Getting starred files for user ${userId}`);
    
    const starredFiles = await File.find({
      userId,
      isStarred: true,
      isDeleted: false
    })
    .sort({ modifiedAt: -1 })
    .select('_id userId name type size path parentPath category cloudProvider cloudId url isStarred isDeleted deletedAt lastAccessed createdAt modifiedAt')
    .lean();
    
    console.log(`Found ${starredFiles.length} starred files`);
    res.json(starredFiles);
  } catch (error) {
    console.error('Error getting starred files:', error);
    res.status(500).json({ message: 'Failed to get starred files' });
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
router.delete('/:fileId', authenticate, async (req, res) => {
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
router.patch('/star/:fileId', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    
    console.log(`Attempting to toggle star for file: ${fileId}, user: ${userId}`);
    
    // Check if file exists first
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      console.log(`File not found: ${fileId}`);
      return res.status(404).json({ message: 'File not found' });
    }
    
    console.log('Current isStarred value:', file.isStarred);
    file.isStarred = !file.isStarred;
    console.log('New isStarred value:', file.isStarred);
    
    file.modifiedAt = new Date();
    await file.save();
    
    console.log(`Star toggled successfully for file: ${fileId}, new isStarred value: ${file.isStarred}`);
    res.json(file);
  } catch (error) {
    console.error('Error toggling star status:', error);
    if (error.name === 'CastError' || error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid file ID format' });
    }
    res.status(500).json({ message: error.message || 'Failed to update star status' });
  }
});

// Empty trash
router.delete('/trash/empty', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get all files AND folders in trash
    const trashedFiles = await fileService.getTrashFiles(userId);
    const trashedFolders = await Folder.find({ userId, isDeleted: true });
    
    if ((!trashedFiles || trashedFiles.length === 0) && (!trashedFolders || trashedFolders.length === 0)) {
      return res.json({ message: 'Trash is already empty' });
    }

    // Delete each file permanently
    const fileDeletePromises = trashedFiles.map(async (file) => {
      try {
        console.log(`🗑️ Deleting file: ${file.name} (${file._id}) | Provider: ${file.cloudProvider} | cloudId: ${file.cloudId}`);
        
        // Delete from cloud storage if applicable
        if (file.cloudProvider === 'cloudinary' && file.cloudId) {
          try {
            console.log(`☁️ Attempting to delete from Cloudinary with cloudId: ${file.cloudId}`);
            const result = await cloudinary.uploader.destroy(file.cloudId);
            console.log(`✅ Cloudinary deletion result:`, result);
            
            if (result.result === 'ok') {
              console.log(`✅ Successfully deleted file from Cloudinary: ${file.cloudId}`);
            } else if (result.result === 'not found') {
              console.warn(`⚠️ File not found in Cloudinary (already deleted?): ${file.cloudId}`);
            } else {
              console.warn(`⚠️ Unexpected Cloudinary result: ${result.result}`);
            }
          } catch (cloudinaryError) {
            console.error(`❌ Error deleting from Cloudinary:`, cloudinaryError);
            console.warn(`⚠️ Warning: Could not delete from Cloudinary: ${cloudinaryError.message}`);
            // Continue with deletion even if Cloudinary fails
          }
        } else if (file.cloudProvider === 'mongodb' && file.cloudId) {
          try {
            console.log(`📦 Attempting to delete from GridFS with cloudId: ${file.cloudId}`);
            await bucket.delete(new mongoose.Types.ObjectId(file.cloudId));
            console.log(`✅ Successfully deleted file from GridFS: ${file.cloudId}`);
          } catch (gridFsError) {
            console.error(`❌ Error deleting from GridFS:`, gridFsError);
            console.warn(`⚠️ Warning: Could not delete from GridFS: ${gridFsError.message}`);
            // Continue with deletion even if GridFS fails
          }
        } else {
          console.log(`⚠️ No cloud storage deletion needed (provider: ${file.cloudProvider}, cloudId: ${file.cloudId || 'missing'})`);
        }
        
        // Delete file document regardless of cloud storage deletion success
        await File.deleteOne({ _id: file._id });
        console.log(`✅ File document deleted from database: ${file._id}`);
        return { success: true, id: file._id, type: 'file', name: file.name };
      } catch (error) {
        console.error(`❌ Error deleting file ${file._id}:`, error);
        return { success: false, id: file._id, type: 'file', name: file.name, error };
      }
    });

    // Delete each folder permanently
    const folderDeletePromises = trashedFolders.map(async (folder) => {
      try {
        await Folder.deleteOne({ _id: folder._id });
        console.log(`Folder permanently deleted from database: ${folder._id}`);
        return { success: true, id: folder._id, type: 'folder' };
      } catch (error) {
        console.error(`Error deleting folder ${folder._id}:`, error);
        return { success: false, id: folder._id, type: 'folder', error };
      }
    });

    const results = await Promise.all([...fileDeletePromises, ...folderDeletePromises]);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    const filesDeleted = results.filter(r => r.success && r.type === 'file').length;
    const foldersDeleted = results.filter(r => r.success && r.type === 'folder').length;
    
    if (failCount > 0) {
      console.log(`Warning: ${failCount} out of ${results.length} items had errors during deletion`);
    }
    
    res.json({ 
      message: failCount > 0 
        ? `Trash emptied with some issues (${successCount} deleted, ${failCount} failed)` 
        : 'Trash emptied successfully',
      success: true,
      stats: { 
        total: results.length, 
        success: successCount, 
        failed: failCount,
        filesDeleted,
        foldersDeleted
      }
    });
  } catch (error) {
    console.error('Error emptying trash:', error);
    res.status(500).json({ message: 'Failed to empty trash' });
  }
});

export default router;