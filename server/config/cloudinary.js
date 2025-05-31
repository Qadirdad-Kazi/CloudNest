import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Verify configuration
console.log('Cloudinary Configuration:', {
  cloud_name: cloudinary.config().cloud_name,
  api_key: cloudinary.config().api_key ? '✓ Set' : '✗ Missing',
  api_secret: cloudinary.config().api_secret ? '✓ Set' : '✗ Missing'
});

export default cloudinary; 