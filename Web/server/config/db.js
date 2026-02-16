import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Debug: Log environment variable status
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI environment variable is NOT set!');
      console.error('Please set MONGODB_URI in your Vercel environment variables.');
      process.exit(1);
    }

    // Debug: Log the first part of the URI (without exposing password)
    const uriPreview = process.env.MONGODB_URI.substring(0, 20) + '...';
    console.log(`📡 Attempting to connect to MongoDB...`);
    console.log(`🔍 MONGODB_URI starts with: ${uriPreview}`);

    // Validate URI format
    if (!process.env.MONGODB_URI.startsWith('mongodb://') && 
        !process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
      console.error('❌ Invalid MONGODB_URI format!');
      console.error('MONGODB_URI must start with "mongodb://" or "mongodb+srv://"');
      console.error(`Current value starts with: "${process.env.MONGODB_URI.substring(0, 15)}"`);
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Log when connection is lost
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB disconnected');
    });

    // Log connection errors
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

export default connectDB; 