import express from 'express';
import { authenticate } from '../middleware/auth.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import File from '../models/File.js';

const router = express.Router();

// Sanitize filename to prevent path traversal attacks
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace any character that's not alphanumeric, underscore, dot, or hyphen
    .replace(/\.\./g, '_'); // Replace double dots to prevent directory traversal
};

// Create uploads directory if it doesn't exist
const ensureUploadsDir = () => {
  const uploadDir = 'uploads/documents/';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  return uploadDir;
};

// Validate file type
const validateFileType = (mimetype) => {
  const allowedTypes = process.env.ALLOWED_DOCUMENT_TYPES ? 
    process.env.ALLOWED_DOCUMENT_TYPES.split(',') : 
    [
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
  
  return allowedTypes.includes(mimetype);
};

// Upload document using express-fileupload
router.post('/upload', authenticate, async (req, res) => {
  try {
    console.log('Document upload request received');
    
    // Check if files were uploaded
    if (!req.files || Object.keys(req.files).length === 0 || !req.files.file) {
      console.error('No file in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const uploadedFile = req.files.file;
    
    console.log('File received:', {
      name: uploadedFile.name,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size
    });
    
    // Validate file type
    if (!validateFileType(uploadedFile.mimetype)) {
      return res.status(400).json({ 
        error: 'Invalid file type', 
        message: `File type ${uploadedFile.mimetype} is not allowed` 
      });
    }
    
    // Validate file size
    const maxSize = process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 10485760; // 10MB default
    if (uploadedFile.size > maxSize) {
      return res.status(400).json({ 
        error: 'File too large', 
        message: `File size exceeds the limit of ${maxSize / (1024 * 1024)}MB` 
      });
    }
    
    // Create a safe filename
    const sanitizedName = sanitizeFilename(uploadedFile.name);
    const filename = `${uuidv4()}-${sanitizedName}`;
    const uploadDir = ensureUploadsDir();
    const filePath = path.join(uploadDir, filename);
    
    // Move the file to the uploads directory
    await uploadedFile.mv(filePath);
    
    const userId = req.user._id;
    console.log('User ID:', userId);
    
    // Log the body to help debug
    console.log('Request body:', req.body);
    
    const { name, path: directoryPath = '/', type, starred = false, tags = [] } = req.body;

    // Determine the file category based on file type
    const determineCategory = (fileType) => {
      const type = fileType.toLowerCase();
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(type)) return 'images';
      if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(type)) return 'documents';
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(type)) return 'videos';
      if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(type)) return 'audio';
      if (['zip', 'rar', '7z', 'tar', 'gz'].includes(type)) return 'archives';
      if (['js', 'ts', 'py', 'java', 'c', 'cpp', 'html', 'css', 'php'].includes(type)) return 'code';
      return 'others';
    };
    
    // Get file type and determine category
    const fileType = type || uploadedFile.name.split('.').pop();
    const category = determineCategory(fileType);
    
    console.log(`Determined category: ${category} for file type: ${fileType}`);
    
    // Create a new file record in the database
    const newFile = new File({
      name: name || uploadedFile.name,
      path: directoryPath,
      parentPath: directoryPath, // Add parentPath to match the path for proper folder filtering
      type: fileType,
      size: uploadedFile.size,
      url: `/uploads/documents/${filename}`,
      userId,
      category, // Add the required category field
      isStarred: starred === 'true' || starred === true,
      isDeleted: false,
      tags: typeof tags === 'string' ? JSON.parse(tags) : (Array.isArray(tags) ? tags : [])
    });

    console.log('Saving file to database:', newFile);
    await newFile.save();
    console.log('File saved successfully');

    res.status(201).json(newFile);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ 
      error: 'Failed to upload document', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
