import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import connectDB from './config/db.js';
import fileRoutes from './routes/fileRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import mongoose from 'mongoose';
import cloudinary from './config/cloudinary.js';
import http from 'http';
import websocketService from './services/websocketService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
        : ['https://cloudnest.qadirdadkazi.com', 'https://cloudnest.vercel.app'])
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'Origin',
    'X-Requested-With',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-CSRF-Token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
};

// Middleware
app.use(cors(corsOptions));
// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/documents', documentRoutes);

// Friendly root route for Vercel
app.get('/', (req, res) => {
  res.send('CloudNest API is running');
});

// Error handling
app.use(errorHandler);

// Connect to MongoDB then start server
const startServer = async () => {
  try {
    await connectDB();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected:', mongoose.connection.host);
    console.log('Cloudinary Configuration:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key ? '✓ Set' : '✗ Not Set',
      api_secret: cloudinary.config().api_secret ? '✓ Set' : '✗ Not Set'
    });
    console.log('Cloudinary configuration:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key,
      api_secret: 'Set (hidden)'
    });
    
    // Create HTTP server for WebSocket support
    const server = http.createServer(app);
    
    // Initialize WebSocket server (only works in non-serverless environments)
    try {
      if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        websocketService.initialize(server);
        console.log('✅ WebSocket server initialized');
      } else {
        console.log('⚠️ WebSocket not available in serverless environment (Vercel)');
      }
    } catch (error) {
      console.warn('⚠️ WebSocket initialization failed (expected in serverless):', error.message);
    }
    
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Export websocketService for use in other modules
export { websocketService };

