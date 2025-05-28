import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import path from 'path';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import shareLinkRoutes from './routes/shareLinkRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET',
  'NODE_ENV'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
  console.error('Please set these variables in your .env file');
  process.exit(1); // Exit with error code
}

// Log environment mode
console.log(`Server running in ${process.env.NODE_ENV} mode`);

// Additional environment variable validation
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
  console.warn('WARNING: JWT_SECRET is too short. For security, use a secret with at least 32 characters.');
}

// ES modules fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Create initial category folders
const createCategoryFolders = async () => {
  const categories = ['images', 'documents', 'videos', 'audio', 'archives', 'code', 'others'];
  const uploadsDir = path.join(__dirname, 'uploads');
  
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    
    for (const category of categories) {
      await fs.mkdir(path.join(uploadsDir, category), { recursive: true });
    }
    console.log('Category folders created successfully');
  } catch (error) {
    console.error('Error creating category folders:', error);
  }
};

createCategoryFolders();

// Parse allowed origins from environment variable
const parseOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  return process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL] // Production client URL from env
    : ['http://localhost:5173', 'http://localhost:3000']; // Default development URLs
};

// Parse allowed methods from environment variable
const parseMethods = () => {
  if (process.env.ALLOWED_METHODS) {
    return process.env.ALLOWED_METHODS.split(',').map(method => method.trim());
  }
  return ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']; // Default methods
};

// Parse allowed headers from environment variable
const parseHeaders = () => {
  if (process.env.ALLOWED_HEADERS) {
    return process.env.ALLOWED_HEADERS.split(',').map(header => header.trim());
  }
  return ['Content-Type', 'Authorization']; // Default headers
};

// Get max file size from environment variable
const getMaxFileSize = () => {
  return parseInt(process.env.MAX_FILE_SIZE || '52428800'); // Default to 50MB
};

// Middleware
app.use(cors({
  origin: parseOrigins(),
  methods: parseMethods(),
  allowedHeaders: parseHeaders(),
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: getMaxFileSize()
  },
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/share-links', shareLinkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/documents', documentRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;