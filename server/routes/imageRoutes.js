import express from 'express';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure Cloudinary using only environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Check if all required environment variables are set
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('WARNING: One or more Cloudinary environment variables are missing. Image uploads may not work correctly.');
}

// Verify Cloudinary configuration
console.log('Cloudinary configuration:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key,
  api_secret: cloudinary.config().api_secret ? 'Set (hidden)' : 'Not set'
});

// Sanitize filename to prevent path traversal attacks
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9_.-]/g, '_') // Replace any character that's not alphanumeric, underscore, dot, or hyphen
    .replace(/\.\./g, '_'); // Replace double dots to prevent directory traversal
};

// Configure multer for temporary file storage with enhanced security
const upload = multer({ 
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = path.join(__dirname, '../temp-uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Sanitize filename and use timestamp to ensure uniqueness
      const sanitizedName = sanitizeFilename(file.originalname);
      cb(null, `${Date.now()}-${sanitizedName}`);
    }
  }),
  limits: { 
    fileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024, // 5MB limit for images
    files: 1 // Allow only one file per request
  },
  fileFilter: function (req, file, cb) {
    // Strict content type validation for images
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp', 
      'image/svg+xml'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid image type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

// Upload image to Cloudinary - authentication required
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path
    const filePath = req.file.path;
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'CloudNest',
      resource_type: 'auto'
    });
    
    // Delete the temporary file
    fs.unlinkSync(filePath);
    
    // Return the Cloudinary URL
    res.json({ 
      url: result.secure_url,
      public_id: result.public_id,
      resource_type: result.resource_type
    });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Delete image from Cloudinary
router.delete('/:publicId', authenticate, async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Ensure the user has permission to delete this image
    // Add your authorization logic here
    
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete image' });
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

export default router;
