import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { promises as fs } from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import monitoringService from './services/monitoringService.js';
import { errorLogger } from './middleware/activityLogger.js';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
import morgan from 'morgan';
import compression from 'compression';
import { rateLimiter } from './middleware/rateLimiter.js';

import authRoutes from './routes/authRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import shareLinkRoutes from './routes/shareLinkRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import userRoutes from './routes/userRoutes.js';

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
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174']; // Default development URLs
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
  return ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Access-Control-Request-Method', 'Access-Control-Request-Headers']; // Default headers
};

// Get max file size from environment variable
const getMaxFileSize = () => {
  return parseInt(process.env.MAX_FILE_SIZE || '52428800'); // Default to 50MB
};

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://cloudnest.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
};

app.use(cors(corsOptions));

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic security headers
app.use(helmet());

// Configure Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self';
     script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:;
     style-src 'self' 'unsafe-inline';
     img-src 'self' data: blob:;
     font-src 'self' data:;
     connect-src 'self' ws: wss: blob:;
     frame-src 'self';
     media-src 'self' blob:;
     object-src 'none';`
  );
  next();
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Compression
app.use(compression());

// Rate limiting
app.use(rateLimiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/shares', shareLinkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;