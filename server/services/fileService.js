import File from '../models/File.js';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';

let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db);
  console.log('GridFS bucket initialized for file service');
});

export const fileService = {
  // Get files in a directory
  async getFiles(userId, parentPath = '/') {
    try {
      console.log(`Getting files for user ${userId} in path ${parentPath}`);
      
      const files = await File.find({
        userId,
        parentPath,
        isDeleted: false
      })
      .sort({ isStarred: -1, name: 1 })
      .select('-__v')
      .lean();
      
      console.log(`Found ${files.length} files`);
      console.log('Files:', files);
      
      return files;
    } catch (error) {
      console.error('Error getting files:', error);
      throw error;
    }
  },

  // Get recent files
  async getRecentFiles(userId, days = 7) {
    try {
      const date = new Date();
      date.setDate(date.getDate() - days);

      const files = await File.find({
        userId,
        isDeleted: false,
        createdAt: { $gte: date }
      })
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

      return files;
    } catch (error) {
      console.error('Error getting recent files:', error);
      throw error;
    }
  },

  // Upload file
  async uploadFile(userId, file, parentPath = '/', onProgress) {
    if (!file) {
      throw new Error('No file provided');
    }

    try {
      console.log(`Starting file upload for user ${userId}`);
      console.log('File details:', {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: parentPath
      });

      const isImage = file.mimetype.startsWith('image/');
      let cloudProvider = isImage ? 'cloudinary' : 'mongodb';
      let cloudId = '';
      let url = '';

      console.log(`Using cloud provider: ${cloudProvider}`);

      // Upload to appropriate storage
      if (cloudProvider === 'cloudinary') {
        console.log('Uploading to Cloudinary...');
        const result = await this.uploadToCloudinary(file);
        cloudId = result.public_id;
        url = result.secure_url;
        console.log('Cloudinary upload successful:', { cloudId, url });
      } else {
        console.log('Uploading to GridFS...');
        const result = await this.uploadToGridFS(file);
        cloudId = result.id;
        url = `/api/files/download/${cloudId}`;
        console.log('GridFS upload successful:', { cloudId, url });
      }

      // Create file document
      const newFile = new File({
        userId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        path: `${parentPath}${file.originalname}`,
        parentPath,
        category: this.getFileCategory(file.mimetype),
        cloudProvider,
        cloudId,
        url
      });

      console.log('Creating file document:', newFile);
      await newFile.save();
      console.log('File document created successfully');

      return newFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Upload to Cloudinary
  async uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'cloudnest', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    });
  },

  // Upload to GridFS
  async uploadToGridFS(file) {
    if (!bucket) {
      throw new Error('GridFS is not initialized');
    }

    return new Promise((resolve, reject) => {
      const filename = `${Date.now()}-${file.originalname}`;
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: file.mimetype
      });

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', () => resolve({
          id: uploadStream.id.toString(),
          filename: filename
        }));
    });
  },

  // Get file category
  getFileCategory(mimeType) {
    const categories = {
      'images': ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      'documents': ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'videos': ['video/mp4', 'video/mpeg', 'video/quicktime'],
      'audio': ['audio/mpeg', 'audio/wav', 'audio/ogg'],
      'archives': ['application/zip', 'application/x-rar-compressed'],
      'code': ['text/javascript', 'text/html', 'text/css', 'application/json']
    };

    for (const [category, types] of Object.entries(categories)) {
      if (types.includes(mimeType)) return category;
    }
    return 'others';
  },

  // Delete file (move to trash)
  async moveToTrash(userId, fileId) {
    try {
      const file = await File.findOneAndUpdate(
        { _id: fileId, userId },
        { 
          isDeleted: true,
          deletedAt: new Date()
        },
        { new: true }
      );

      if (!file) {
        throw new Error('File not found');
      }

      return file;
    } catch (error) {
      console.error('Error moving file to trash:', error);
      throw error;
    }
  },

  // Get files in trash
  async getTrashFiles(userId) {
    try {
      const files = await File.find({
        userId,
        isDeleted: true
      })
      .sort({ deletedAt: -1 })
      .select('-__v')
      .lean();

      return files;
    } catch (error) {
      console.error('Error getting trash files:', error);
      throw error;
    }
  },

  // Restore file from trash
  async restoreFromTrash(userId, fileId) {
    try {
      const file = await File.findOneAndUpdate(
        { _id: fileId, userId },
        { 
          isDeleted: false,
          deletedAt: null
        },
        { new: true }
      );

      if (!file) {
        throw new Error('File not found');
      }

      return file;
    } catch (error) {
      console.error('Error restoring file:', error);
      throw error;
    }
  },

  // Permanently delete file
  async permanentlyDeleteFile(userId, fileId) {
    try {
      const file = await File.findOne({ _id: fileId, userId });
      
      if (!file) {
        throw new Error('File not found');
      }

      // Delete from cloud storage
      if (file.cloudProvider === 'cloudinary') {
        await cloudinary.uploader.destroy(file.cloudId);
      } else if (file.cloudProvider === 'mongodb' && bucket) {
        await bucket.delete(new mongoose.Types.ObjectId(file.cloudId));
      }

      // Delete file document
      await file.deleteOne();

      return { success: true };
    } catch (error) {
      console.error('Error permanently deleting file:', error);
      throw error;
    }
  },

  // Toggle star status
  async toggleStar(userId, fileId) {
    try {
      const file = await File.findOne({ _id: fileId, userId });
      
      if (!file) {
        throw new Error('File not found');
      }

      file.isStarred = !file.isStarred;
      file.modifiedAt = new Date();
      
      await file.save();
      return file;
    } catch (error) {
      console.error('Error toggling star status:', error);
      throw error;
    }
  }
}; 