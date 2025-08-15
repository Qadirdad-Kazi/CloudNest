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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Helpers to parse env-based origins
const parseOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  }
  return process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:3000'];
};

// CORS configuration (env-driven)
const corsOptions = {
  origin: parseOrigins(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'Access-Control-Request-Method', 'Access-Control-Request-Headers', 'X-CSRF-Token'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 600 // 10 minutes
};

// Debug allowed origins at boot
console.log('CORS allowed origins (index.js):', JSON.stringify(corsOptions.origin));

// Warn when a request comes from a non-allowed origin (production only)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const origin = req.headers.origin;
    const allowed = Array.isArray(corsOptions.origin) ? corsOptions.origin : [corsOptions.origin];
    if (origin && !allowed.includes(origin)) {
      console.warn(`CORS blocked origin (index.js): ${origin}. Allowed: ${allowed.join(', ')}`);
    }
  }
  next();
});

// Middleware
app.use(cors(corsOptions));
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
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

