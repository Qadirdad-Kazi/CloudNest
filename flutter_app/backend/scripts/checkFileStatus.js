import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { File } from '../models/File.js';

dotenv.config();

async function checkFileStatus() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Cloudnest:Password1@cloudnest.vn8asxd.mongodb.net/?appName=CloudNest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get the specific file
    const file = await File.findById('68ff5e26d1f64f4a7d90c22d');

    if (!file) {
      console.log('❌ File not found in database');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('📄 FILE DETAILS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(JSON.stringify(file, null, 2));
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    console.log('\n📊 STATUS:');
    console.log(`├─ In Trash (isDeleted): ${file.isDeleted ? '✅ YES' : '❌ NO'}`);
    console.log(`├─ Deleted At: ${file.deletedAt || 'N/A'}`);
    console.log(`└─ File still exists in database: ✅ YES`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFileStatus();

