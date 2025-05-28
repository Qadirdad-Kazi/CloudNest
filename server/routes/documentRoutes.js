import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import File from '../models/File.js';

const router = express.Router();

// Set up multer for document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/documents/';
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
  }
});

// Upload document
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user._id;
    const { name, path: filePath = '/', type, size, starred = false, tags = [] } = req.body;

    // Create a new file record in the database
    const newFile = new File({
      name: name || req.file.originalname,
      path: filePath,
      type: type || req.file.originalname.split('.').pop(),
      size: size || req.file.size,
      url: `/uploads/documents/${req.file.filename}`,
      userId,
      starred: starred === 'true' || starred === true,
      isDeleted: false,
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags
    });

    await newFile.save();

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Get document by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, userId: req.user._id });
    
    if (!file) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Check if file exists on disk
    const filePath = path.join(process.cwd(), file.url);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document file not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error retrieving document:', error);
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

export default router;
