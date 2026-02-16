import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { File } from '../models/File.js';
import cloudinary from '../config/cloudinary.js';

// Try both .env and .env.local
dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * Script to test file deletion from Cloudinary and MongoDB
 */
async function testDelete() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://Cloudnest:Password1@cloudnest.vn8asxd.mongodb.net/?appName=CloudNest';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Get all Cloudinary files
    const cloudinaryFiles = await File.find({ 
      cloudProvider: 'cloudinary'
    }).sort({ createdAt: -1 });

    if (cloudinaryFiles.length === 0) {
      console.log('⚠️ No Cloudinary files found to delete');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`📊 Found ${cloudinaryFiles.length} Cloudinary file(s) to delete\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Delete each file
    for (const file of cloudinaryFiles) {
      console.log(`\n🗑️  Processing: ${file.name}`);
      console.log(`├─ File ID:      ${file._id}`);
      console.log(`├─ cloudId:      ${file.cloudId}`);
      console.log(`├─ cloudProvider: ${file.cloudProvider}`);
      console.log(`├─ URL:          ${file.url}`);
      console.log(`└─ Size:         ${(file.size / 1024).toFixed(2)} KB`);

      try {
        // Step 1: Delete from Cloudinary
        if (file.cloudProvider === 'cloudinary' && file.cloudId) {
          console.log(`\n☁️  Attempting to delete from Cloudinary...`);
          console.log(`   cloudId: ${file.cloudId}`);
          
          try {
            const result = await cloudinary.uploader.destroy(file.cloudId);
            console.log(`   Cloudinary response:`, result);
            
            if (result.result === 'ok') {
              console.log(`   ✅ Successfully deleted from Cloudinary!`);
            } else if (result.result === 'not found') {
              console.log(`   ⚠️  File not found in Cloudinary (already deleted or never existed)`);
            } else {
              console.log(`   ⚠️  Unexpected result: ${result.result}`);
            }
          } catch (cloudinaryError) {
            console.error(`   ❌ Cloudinary deletion error:`, cloudinaryError.message);
          }
        }

        // Step 2: Delete from MongoDB
        console.log(`\n📦 Deleting from MongoDB database...`);
        await File.deleteOne({ _id: file._id });
        console.log(`   ✅ Successfully deleted from MongoDB!`);

        console.log(`\n✅ COMPLETE: ${file.name} deleted successfully!\n`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      } catch (error) {
        console.error(`\n❌ Error deleting ${file.name}:`, error.message);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
    }

    // Final summary
    console.log(`\n\n📈 DELETION SUMMARY:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📊 Total files processed: ${cloudinaryFiles.length}`);

    // Verify deletion
    console.log(`\n🔍 Verifying deletion from MongoDB...`);
    const remainingFiles = await File.find({ cloudProvider: 'cloudinary' });
    console.log(`   Remaining Cloudinary files: ${remainingFiles.length}`);

    if (remainingFiles.length === 0) {
      console.log(`   ✅ All files successfully deleted from MongoDB!`);
    } else {
      console.log(`   ⚠️  ${remainingFiles.length} file(s) still remain`);
    }

    console.log(`\n✅ Test deletion completed!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Instructions for verification
    console.log(`\n📋 NEXT STEPS - Verify in Cloudinary:`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    for (const file of cloudinaryFiles) {
      console.log(`\n🔗 Test URL (should return 404):`);
      console.log(`   ${file.url}`);
      console.log(`\n🔍 Or go to Cloudinary Dashboard and search for:`);
      console.log(`   ${file.cloudId}`);
      console.log(`   (Should show "No results found")`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testDelete();

