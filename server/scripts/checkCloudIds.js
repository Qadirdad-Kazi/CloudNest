import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { File } from '../models/File.js';

dotenv.config();

/**
 * Script to check cloudId status for files
 */
async function checkCloudIds() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Cloudnest:Password1@cloudnest.vn8asxd.mongodb.net/?appName=CloudNest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all Cloudinary files
    const cloudinaryFiles = await File.find({ 
      cloudProvider: 'cloudinary'
    }).sort({ createdAt: -1 }).limit(10);

    console.log(`📊 Found ${cloudinaryFiles.length} recent Cloudinary files\n`);

    if (cloudinaryFiles.length === 0) {
      console.log('⚠️ No Cloudinary files found in database');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (const file of cloudinaryFiles) {
      const isValidCloudId = file.cloudId && 
                            !file.cloudId.startsWith('file_') && 
                            file.cloudId.length > 10;
      
      const status = isValidCloudId ? '✅ VALID' : '❌ INVALID';
      
      console.log(`\n${status} | ${file.name}`);
      console.log(`├─ File ID:      ${file._id}`);
      console.log(`├─ cloudId:      ${file.cloudId}`);
      console.log(`├─ cloudProvider: ${file.cloudProvider}`);
      console.log(`├─ URL:          ${file.url}`);
      console.log(`├─ Created:      ${file.createdAt}`);
      console.log(`├─ Size:         ${(file.size / 1024).toFixed(2)} KB`);
      console.log(`└─ User:         ${file.userId}`);
      
      if (!isValidCloudId) {
        console.log(`   ⚠️ CloudId looks incorrect - should be extracted from URL`);
        
        // Try to extract correct cloudId
        if (file.url) {
          const matches = file.url.match(/\/v\d+\/([^\/\.]+)/);
          if (matches && matches[1]) {
            console.log(`   💡 Suggested cloudId: ${matches[1]}`);
          }
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Summary
    const validCount = cloudinaryFiles.filter(f => 
      f.cloudId && !f.cloudId.startsWith('file_') && f.cloudId.length > 10
    ).length;
    const invalidCount = cloudinaryFiles.length - validCount;
    
    console.log('\n📈 Summary:');
    console.log(`✅ Valid cloudIds:   ${validCount}`);
    console.log(`❌ Invalid cloudIds: ${invalidCount}`);
    console.log(`📊 Total checked:    ${cloudinaryFiles.length}`);

    // Show the most recent file in detail
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🔍 MOST RECENT FILE (for testing):');
    const latest = cloudinaryFiles[0];
    console.log(JSON.stringify({
      _id: latest._id,
      name: latest.name,
      cloudProvider: latest.cloudProvider,
      cloudId: latest.cloudId,
      url: latest.url,
      size: latest.size,
      createdAt: latest.createdAt
    }, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCloudIds();

