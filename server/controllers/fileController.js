import { File } from '../models/File.js';
import mongoose from 'mongoose';
import cloudinary from '../config/cloudinary.js';
import { GridFSBucket } from 'mongodb';
import User from '../models/User.js';

// Initialize GridFS bucket
let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db);
});

// File type categories
const fileCategories = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ],
  videos: ['video/mp4', 'video/mpeg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  archives: ['application/zip', 'application/x-rar-compressed'],
  code: ['text/javascript', 'text/html', 'text/css', 'application/json']
};

// Get category for a file type
const getFileCategory = (mimeType) => {
  for (const [category, types] of Object.entries(fileCategories)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'others';
};

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.file;
    const userId = req.user._id;
    const parentPath = req.body.path || '/';
    const category = getFileCategory(file.mimetype);
    
    // Determine storage provider based on file type
    const isImage = file.mimetype.startsWith('image/');
    const cloudProvider = isImage ? 'cloudinary' : 'mongodb';
    let cloudId = '';
    let url = '';

    if (cloudProvider === 'cloudinary') {
      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: 'cloudnest', resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        uploadStream.end(file.buffer);
      });

      cloudId = result.public_id;
      url = result.secure_url;
    } else {
      // Upload to MongoDB GridFS
      const filename = `${Date.now()}-${file.originalname}`;
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype
      });

      await new Promise((resolve, reject) => {
        const bufferStream = require('stream').Readable.from(file.buffer);
        bufferStream.pipe(uploadStream)
          .on('error', reject)
          .on('finish', resolve);
      });

      cloudId = uploadStream.id.toString();
      url = `/api/files/download/${cloudId}`;
    }

    // Create file document in MongoDB
    const newFile = new File({
      userId,
      name: file.originalname,
      type: file.mimetype,
      size: file.size,
      path: `${parentPath}${file.originalname}`,
      parentPath,
      category,
      cloudProvider,
      cloudId,
      url
    });

    await newFile.save();

    // Patch: Update user's storageUsed after upload
    const totalUsed = await File.aggregate([
      { $match: { userId: newFile.userId, isDeleted: false } },
      { $group: { _id: null, total: { $sum: '$size' } } }
    ]);
    await User.findByIdAndUpdate(newFile.userId, { storageUsed: totalUsed[0]?.total || 0 });

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

export const getFiles = async (req, res) => {
  try {
    const userId = req.user._id;
    const parentPath = req.query.path || '/';

    const files = await File.find({ 
      userId, 
      parentPath,
      isDeleted: false 
    }).sort({ isStarred: -1, name: 1 });

    res.json(files);
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ message: 'Failed to get files' });
  }
};

export const deleteFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;
    const permanent = req.query.permanent === 'true';

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (permanent) {
      // Delete from cloud storage
      if (file.cloudProvider === 'cloudinary') {
        await cloudinary.uploader.destroy(file.cloudId);
      } else if (file.cloudProvider === 'mongodb') {
        await bucket.delete(new mongoose.Types.ObjectId(file.cloudId));
      }

      // Delete file document
      await file.deleteOne();
      // Patch: Update user's storageUsed after permanent delete
      const totalUsed = await File.aggregate([
        { $match: { userId: file.userId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]);
      await User.findByIdAndUpdate(file.userId, { storageUsed: totalUsed[0]?.total || 0 });
      res.json({ message: 'File permanently deleted' });
    } else {
      // Move to trash
      file.isDeleted = true;
      file.deletedAt = new Date();
      await file.save();
      // Patch: Update user's storageUsed after move to trash
      const totalUsed = await File.aggregate([
        { $match: { userId: file.userId, isDeleted: false } },
        { $group: { _id: null, total: { $sum: '$size' } } }
      ]);
      await User.findByIdAndUpdate(file.userId, { storageUsed: totalUsed[0]?.total || 0 });
      res.json({ message: 'File moved to trash' });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

export const downloadFile = async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const userId = req.user._id;

    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    if (file.cloudProvider === 'cloudinary') {
      // Redirect to Cloudinary URL
      res.redirect(file.url);
    } else {
      // Stream from GridFS
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(file.cloudId));
      res.set('Content-Type', file.type);
      res.set('Content-Disposition', `attachment; filename="${file.name}"`);
      downloadStream.pipe(res);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
}; 