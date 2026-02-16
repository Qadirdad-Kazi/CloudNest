import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { File } from '../models/File.js';

dotenv.config();

/**
 * Script to fix cloudId for existing files
 * Extracts cloudId from Cloudinary URLs
 */
async function fixCloudIds() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all Cloudinary files
    const cloudinaryFiles = await File.find({ 
      cloudProvider: 'cloudinary'
    });

    console.log(`\n📊 Found ${cloudinaryFiles.length} Cloudinary files`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let failed = 0;

    for (const file of cloudinaryFiles) {
      try {
        // Check if cloudId is already valid (not extracted from URL pattern)
        const isValidCloudId = file.cloudId && 
                              !file.cloudId.startsWith('file_') && 
                              file.cloudId.length > 10;

        if (isValidCloudId) {
          console.log(`✅ ${file.name} - cloudId already correct: ${file.cloudId}`);
          alreadyCorrect++;
          continue;
        }

        // Extract cloudId from URL
        if (file.url) {
          // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.{format}
          const matches = file.url.match(/\/v\d+\/([^\/\.]+)/);
          
          if (matches && matches[1]) {
            const extractedCloudId = matches[1];
            file.cloudId = extractedCloudId;
            await file.save();
            console.log(`🔧 Fixed ${file.name}: ${extractedCloudId}`);
            fixed++;
          } else {
            console.warn(`⚠️ Could not extract cloudId from URL for ${file.name}: ${file.url}`);
            failed++;
          }
        } else {
          console.warn(`⚠️ No URL found for ${file.name}`);
          failed++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error.message);
        failed++;
      }
    }

    console.log('\n📈 Summary:');
    console.log(`✅ Already correct: ${alreadyCorrect}`);
    console.log(`🔧 Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total: ${cloudinaryFiles.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

fixCloudIds();

