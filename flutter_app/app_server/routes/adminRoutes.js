import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { File } from '../models/File.js';
import User from '../models/User.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error checking admin status' });
  }
};

// Apply authentication to all routes
router.use(authenticate);
router.use(isAdmin);

/**
 * POST /api/admin/fix-cloudids
 * Fix cloudIds for all Cloudinary files
 */
router.post('/fix-cloudids', async (req, res) => {
  try {
    console.log('🔧 Starting cloudId fix migration...');

    // Find all Cloudinary files
    const cloudinaryFiles = await File.find({ 
      cloudProvider: 'cloudinary'
    });

    console.log(`📊 Found ${cloudinaryFiles.length} Cloudinary files`);

    let fixed = 0;
    let alreadyCorrect = 0;
    let failed = 0;
    const results = [];

    for (const file of cloudinaryFiles) {
      try {
        // Check if cloudId is already valid
        const isValidCloudId = file.cloudId && 
                              !file.cloudId.startsWith('file_') && 
                              file.cloudId.length > 10;

        if (isValidCloudId) {
          console.log(`✅ ${file.name} - cloudId already correct: ${file.cloudId}`);
          alreadyCorrect++;
          results.push({
            file: file.name,
            status: 'already_correct',
            cloudId: file.cloudId
          });
          continue;
        }

        // Extract cloudId from URL
        if (file.url) {
          const matches = file.url.match(/\/v\d+\/([^\/\.]+)/);
          
          if (matches && matches[1]) {
            const oldCloudId = file.cloudId;
            const extractedCloudId = matches[1];
            file.cloudId = extractedCloudId;
            await file.save();
            console.log(`🔧 Fixed ${file.name}: ${oldCloudId} → ${extractedCloudId}`);
            fixed++;
            results.push({
              file: file.name,
              status: 'fixed',
              oldCloudId,
              newCloudId: extractedCloudId
            });
          } else {
            console.warn(`⚠️ Could not extract cloudId from URL for ${file.name}`);
            failed++;
            results.push({
              file: file.name,
              status: 'failed',
              reason: 'Could not extract cloudId from URL',
              url: file.url
            });
          }
        } else {
          console.warn(`⚠️ No URL found for ${file.name}`);
          failed++;
          results.push({
            file: file.name,
            status: 'failed',
            reason: 'No URL found'
          });
        }
  } catch (error) {
        console.error(`❌ Error processing ${file.name}:`, error.message);
        failed++;
        results.push({
          file: file.name,
          status: 'error',
          error: error.message
        });
      }
    }

    const summary = {
      total: cloudinaryFiles.length,
      alreadyCorrect,
      fixed,
      failed,
      results
    };

    console.log('\n📈 Summary:', summary);
    
    res.json({
      message: 'CloudId fix migration completed',
      summary
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({ 
      message: 'Migration failed', 
      error: error.message 
    });
  }
});

export default router;
