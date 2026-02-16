import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { File } from '../models/File.js';

dotenv.config();

async function checkAllFiles() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Cloudnest:Password1@cloudnest.vn8asxd.mongodb.net/?appName=CloudNest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get ALL files (including deleted)
    const allFiles = await File.find({ 
      cloudProvider: 'cloudinary',
      userId: '68ff4998c4990d87325160cf'
    }).sort({ createdAt: -1 });

    console.log(`📊 Total Cloudinary files in database: ${allFiles.length}\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    for (const file of allFiles) {
      const status = file.isDeleted ? '🗑️  IN TRASH' : '✅ ACTIVE';
      console.log(`${status} | ${file.name}`);
      console.log(`├─ File ID:      ${file._id}`);
      console.log(`├─ cloudId:      ${file.cloudId}`);
      console.log(`├─ isDeleted:    ${file.isDeleted}`);
      console.log(`├─ deletedAt:    ${file.deletedAt || 'N/A'}`);
      console.log(`├─ URL:          ${file.url}`);
      console.log(`└─ Created:      ${file.createdAt}\n`);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const activeCount = allFiles.filter(f => !f.isDeleted).length;
    const trashedCount = allFiles.filter(f => f.isDeleted).length;
    
    console.log('\n📈 Summary:');
    console.log(`✅ Active files:  ${activeCount}`);
    console.log(`🗑️  Trashed files: ${trashedCount}`);
    console.log(`📊 Total files:   ${allFiles.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllFiles();

