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

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../temp-uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
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

// Public upload endpoint for testing purposes
router.post('/upload-public', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the file path
    const filePath = req.file.path;
    console.log('File uploaded to temp location:', filePath);
    
    try {
      // Upload to Cloudinary
      console.log('Attempting to upload to Cloudinary...');
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'CloudNest',
        resource_type: 'auto'
      });
      
      console.log('Cloudinary upload successful:', result.secure_url);
      
      // Delete the temporary file
      fs.unlinkSync(filePath);
      
      // Return the Cloudinary URL
      return res.json({ 
        url: result.secure_url,
        public_id: result.public_id,
        resource_type: result.resource_type
      });
    } catch (cloudinaryError) {
      console.error('Cloudinary upload error:', cloudinaryError);
      
      // If Cloudinary fails, create a local URL for the file
      const localUrl = `/uploads/images/${path.basename(filePath)}`;
      
      // Move the file to a permanent location
      const targetDir = path.join(process.cwd(), 'uploads/images');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      
      const targetPath = path.join(targetDir, path.basename(filePath));
      fs.copyFileSync(filePath, targetPath);
      fs.unlinkSync(filePath); // Remove the temp file
      
      console.log('Fallback to local storage:', localUrl);
      
      // Return the local URL
      return res.json({ 
        url: localUrl,
        public_id: path.basename(filePath),
        resource_type: 'image'
      });
    }
  } catch (error) {
    console.error('Server error in upload-public:', error);
    res.status(500).json({ 
      error: 'Failed to upload image', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;
