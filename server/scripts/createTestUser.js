import mongoose from 'mongoose';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudnest');
    
    // Check if test user exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    if (existingUser) {
      console.log('Test user already exists');
      process.exit(0);
    }

    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      settings: {
        notifications: {
          email: true,
          push: true,
          updates: false
        },
        privacy: {
          publicProfile: false,
          showActivity: true,
          shareStats: false
        },
        security: {
          twoFactor: false,
          loginAlerts: true,
          deviceHistory: true
        },
        appearance: {
          darkMode: false,
          compactView: false,
          showThumbnails: true
        },
        language: 'en'
      }
    });

    await user.save();
    console.log('Test user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test user:', error);
    process.exit(1);
  }
};

createTestUser(); 