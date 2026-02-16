import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { GridFSBucket } from 'mongodb';
import mongoose from 'mongoose';
import { Readable } from 'stream';
import { File } from '../models/File.js';

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
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid document type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Initialize GridFS bucket
let bucket;
mongoose.connection.once('open', () => {
  bucket = new GridFSBucket(mongoose.connection.db);
  console.log('GridFS bucket initialized for documents');
});

// Upload document
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!bucket) {
      return res.status(503).json({ message: 'MongoDB GridFS is not initialized yet. Please try again in a moment.' });
    }

    // Upload to MongoDB GridFS
    const filename = `${Date.now()}-${req.file.originalname}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: req.file.mimetype
    });

    await new Promise((resolve, reject) => {
      const bufferStream = new Readable();
      bufferStream.push(req.file.buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream)
        .on('error', reject)
        .on('finish', resolve);
    });

    const cloudId = uploadStream.id.toString();
    const url = `/api/documents/download/${cloudId}`;

    // Create new file document
    const newFile = new File({
      userId: req.user._id,
      name: req.file.originalname,
      type: req.file.mimetype.split('/')[1],
      size: req.file.size,
      path: req.body.path || '/',
      parentPath: req.body.path || '/',
      category: 'documents',
      cloudProvider: 'mongodb',
      cloudId,
      url
    });

    await newFile.save();

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/download/:fileId', async (req, res) => {
  try {
    if (!bucket) {
      return res.status(503).json({ message: 'MongoDB GridFS is not initialized yet. Please try again in a moment.' });
    }

    const file = await File.findOne({ _id: req.params.fileId, userId: req.user._id });
    
    if (!file) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(file.cloudId));
    res.set('Content-Type', file.type);
    res.set('Content-Disposition', `attachment; filename="${file.name}"`);
    
    downloadStream.pipe(res);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Failed to download document' });
  }
});

export default router;
