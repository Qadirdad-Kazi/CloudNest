import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Configure CORS settings for Cloudinary
cloudinary.config().cors = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://cloudnest.vercel.app']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
};

// Verify configuration
console.log('Cloudinary Configuration:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? '✓ Set' : '✗ Missing',
  api_secret: cloudinary.config().api_secret ? '✓ Set' : '✗ Missing'
});

export default cloudinary; 