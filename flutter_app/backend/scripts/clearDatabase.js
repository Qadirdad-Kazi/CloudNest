import mongoose from 'mongoose';
import dotenv from 'dotenv';
import readline from 'readline';

// Import all models
import User from '../models/User.js';
import { File } from '../models/File.js'; // Named export
import Folder from '../models/Folder.js';
import Notification from '../models/Notification.js';
import ShareLink from '../models/ShareLink.js';
import Suggestion from '../models/Suggestion.js';
import ActivityLog from '../models/ActivityLog.js';
import SystemMetric from '../models/SystemMetric.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const clearDatabase = async () => {
  try {
    console.log('\n🚨 WARNING: DATABASE CLEAR OPERATION 🚨\n');
    console.log('This will permanently delete ALL data from your database:');
    console.log('  ❌ Users');
    console.log('  ❌ Files');
    console.log('  ❌ Folders');
    console.log('  ❌ Notifications');
    console.log('  ❌ Share Links');
    console.log('  ❌ Suggestions');
    console.log('  ❌ Activity Logs');
    console.log('  ❌ System Metrics');
    console.log('\n⚠️  THIS CANNOT BE UNDONE! ⚠️\n');

    const answer = await question('Are you sure you want to continue? (type "YES" to confirm): ');

    if (answer !== 'YES') {
      console.log('\n✅ Operation cancelled. No data was deleted.');
      rl.close();
      process.exit(0);
    }

    // Connect to MongoDB
    console.log('\n📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Count documents before deletion
    const counts = {
      users: await User.countDocuments(),
      files: await File.countDocuments(),
      folders: await Folder.countDocuments(),
      notifications: await Notification.countDocuments(),
      shareLinks: await ShareLink.countDocuments(),
      suggestions: await Suggestion.countDocuments(),
      activityLogs: await ActivityLog.countDocuments(),
      systemMetrics: await SystemMetric.countDocuments()
    };

    console.log('📊 Current database contents:');
    console.log(`  Users: ${counts.users}`);
    console.log(`  Files: ${counts.files}`);
    console.log(`  Folders: ${counts.folders}`);
    console.log(`  Notifications: ${counts.notifications}`);
    console.log(`  Share Links: ${counts.shareLinks}`);
    console.log(`  Suggestions: ${counts.suggestions}`);
    console.log(`  Activity Logs: ${counts.activityLogs}`);
    console.log(`  System Metrics: ${counts.systemMetrics}`);

    const totalDocs = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n  📦 Total documents: ${totalDocs}\n`);

    if (totalDocs === 0) {
      console.log('✨ Database is already empty!');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    const finalConfirm = await question(`Type "DELETE ${totalDocs}" to confirm deletion: `);

    if (finalConfirm !== `DELETE ${totalDocs}`) {
      console.log('\n✅ Operation cancelled. No data was deleted.');
      rl.close();
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n🗑️  Clearing database...\n');

    // Delete all data
    const results = await Promise.all([
      User.deleteMany({}),
      File.deleteMany({}),
      Folder.deleteMany({}),
      Notification.deleteMany({}),
      ShareLink.deleteMany({}),
      Suggestion.deleteMany({}),
      ActivityLog.deleteMany({}),
      SystemMetric.deleteMany({})
    ]);

    console.log('✅ Deletion complete!\n');
    console.log('📊 Deleted:');
    console.log(`  ❌ Users: ${results[0].deletedCount}`);
    console.log(`  ❌ Files: ${results[1].deletedCount}`);
    console.log(`  ❌ Folders: ${results[2].deletedCount}`);
    console.log(`  ❌ Notifications: ${results[3].deletedCount}`);
    console.log(`  ❌ Share Links: ${results[4].deletedCount}`);
    console.log(`  ❌ Suggestions: ${results[5].deletedCount}`);
    console.log(`  ❌ Activity Logs: ${results[6].deletedCount}`);
    console.log(`  ❌ System Metrics: ${results[7].deletedCount}`);

    const totalDeleted = results.reduce((sum, result) => sum + result.deletedCount, 0);
    console.log(`\n  🗑️  Total deleted: ${totalDeleted} documents\n`);

    console.log('✨ Database is now empty!\n');

    rl.close();
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error clearing database:', error);
    rl.close();
    process.exit(1);
  }
};

// Run the script
clearDatabase();

