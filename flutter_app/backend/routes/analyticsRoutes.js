import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { Analytics } from '../models/Analytics.js';
import { FileActivity } from '../models/FileActivity.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';
import { ShareLink } from '../models/ShareLink.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get storage analytics
router.get('/storage', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get user's files for storage calculation
    const files = await File.find({ userId, isDeleted: false });
    
    // Calculate storage metrics
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;
    
    // Group files by type
    const filesByType = files.reduce((acc, file) => {
      const type = file.type.split('/')[0] || 'other';
      if (!acc[type]) {
        acc[type] = { count: 0, size: 0 };
      }
      acc[type].count++;
      acc[type].size += file.size;
      return acc;
    }, {});

    // Calculate storage growth over time
    const storageGrowth = await Analytics.aggregate([
      {
        $match: {
          userId,
          type: 'storage',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          totalSize: { $sum: '$data.totalSize' },
          fileCount: { $sum: '$data.fileCount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get storage usage trends
    const usageTrends = await Analytics.aggregate([
      {
        $match: {
          userId,
          type: 'storage',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          avgDailySize: { $avg: '$data.dailySize' },
          maxDailySize: { $max: '$data.dailySize' },
          minDailySize: { $min: '$data.dailySize' }
        }
      }
    ]);

    res.json({
      summary: {
        totalSize,
        fileCount,
        averageFileSize: fileCount > 0 ? totalSize / fileCount : 0,
        filesByType,
        period
      },
      growth: storageGrowth,
      trends: usageTrends[0] || {},
    });
  } catch (error) {
    console.error('Storage analytics error:', error);
    res.status(500).json({ message: 'Failed to get storage analytics', error: error.message });
  }
});

// Get activity dashboard
router.get('/activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Get activity metrics
    const totalActivities = await FileActivity.countDocuments({
      userId,
      timestamp: { $gte: startDate, $lte: endDate }
    });

    // Activities by type
    const activitiesByType = await FileActivity.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          successRate: { $avg: { $cond: ['$success', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Daily activity trends
    const dailyActivity = await FileActivity.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          count: { $sum: 1 },
          uniqueFiles: { $addToSet: '$fileId' }
        }
      },
      {
        $project: {
          date: '$_id',
          count: 1,
          uniqueFiles: { $size: '$uniqueFiles' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Peak activity hours
    const peakHours = await FileActivity.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $project: {
          hour: { $hour: '$timestamp' },
          count: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Most active files
    const mostActiveFiles = await FileActivity.aggregate([
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$fileId',
          count: { $sum: 1 },
          uniqueActions: { $addToSet: '$action' }
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'file'
        }
      },
      {
        $project: {
          fileId: '$_id',
          fileName: { $arrayElemAt: ['$file', 0, 'name'] },
          fileType: { $arrayElemAt: ['$file', 0, 'type'] },
          count: 1,
          uniqueActions: { $size: '$uniqueActions' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      summary: {
        totalActivities,
        period,
        averageDailyActivities: dailyActivity.length > 0 ? 
          Math.round(totalActivities / dailyActivity.length) : 0
      },
      byType: activitiesByType,
      dailyActivity,
      peakHours,
      mostActiveFiles
    });
  } catch (error) {
    console.error('Activity analytics error:', error);
    res.status(500).json({ message: 'Failed to get activity analytics', error: error.message });
  }
});

// Get file statistics
router.get('/files', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d', sortBy = 'accessed' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Most accessed files
    const mostAccessed = await FileActivity.aggregate([
      {
        $match: {
          userId,
          action: 'view',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$fileId',
          count: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'file'
        }
      },
      {
        $project: {
          fileId: '$_id',
          fileName: { $arrayElemAt: ['$file', 0, 'name'] },
          fileType: { $arrayElemAt: ['$file', 0, 'type'] },
          size: { $arrayElemAt: ['$file', 0, 'size'] },
          count: 1,
          uniqueUsers: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);

    // Most shared files
    const mostShared = await ShareLink.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$entityId',
          count: { $sum: 1 },
          entityType: { $first: '$entityType' }
        }
      },
      {
        $match: { entityType: 'file' }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'file'
        }
      },
      {
        $project: {
          fileId: '$_id',
          fileName: { $arrayElemAt: ['$file', 0, 'name'] },
          fileType: { $arrayElemAt: ['$file', 0, 'type'] },
          shareCount: '$count'
        }
      },
      { $sort: { shareCount: -1 } },
      { $limit: 20 }
    ]);

    // Most downloaded files
    const mostDownloaded = await FileActivity.aggregate([
      {
        $match: {
          userId,
          action: 'download',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$fileId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'files',
          localField: '_id',
          foreignField: '_id',
          as: 'file'
        }
      },
      {
        $project: {
          fileId: '$_id',
          fileName: { $arrayElemAt: ['$file', 0, 'name'] },
          fileType: { $arrayElemAt: ['$file', 0, 'type'] },
          size: { $arrayElemAt: ['$file', 0, 'size'] },
          downloadCount: '$count'
        }
      },
      { $sort: { downloadCount: -1 } },
      { $limit: 20 }
    ]);

    // File type distribution
    const fileTypeDistribution = await File.aggregate([
      {
        $match: {
          userId,
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { $substr: ['$type', 0, { $indexOfBytes: ['$type', '/'] } ] },
          count: { $sum: 1 },
          totalSize: { $sum: '$size' },
          avgSize: { $avg: '$size' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // File size distribution
    const fileSizeDistribution = await File.aggregate([
      {
        $match: {
          userId,
          isDeleted: false
        }
      },
      {
        $bucket: {
          groupBy: '$size',
          boundaries: [0, 1024, 10240, 102400, 1048576, 10485760, 104857600],
          default: 'other',
          output: {
            range: '$range',
            count: { $sum: 1 }
          }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    res.json({
      summary: {
        period,
        totalFiles: await File.countDocuments({ userId, isDeleted: false })
      },
      mostAccessed,
      mostShared,
      mostDownloaded,
      fileTypeDistribution,
      fileSizeDistribution
    });
  } catch (error) {
    console.error('File statistics error:', error);
    res.status(500).json({ message: 'Failed to get file statistics', error: error.message });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '24h' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '1h':
        startDate.setHours(startDate.getHours() - 1);
        break;
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 1);
    }

    // Get performance analytics
    const performanceData = await Analytics.find({
      userId,
      type: 'performance',
      timestamp: { $gte: startDate, $lte: endDate }
    }).sort({ timestamp: -1 });

    // Calculate metrics
    const metrics = {
      avgResponseTime: 0,
      errorRate: 0,
      throughput: 0,
      uptime: 0,
      memoryUsage: [],
      cpuUsage: []
    };

    if (performanceData.length > 0) {
      const responseTimes = performanceData.map(d => d.data.responseTime || 0).filter(t => t > 0);
      const errorRates = performanceData.map(d => d.data.errorRate || 0);
      const throughputs = performanceData.map(d => d.data.throughput || 0);
      const memoryUsages = performanceData.map(d => d.data.memoryUsage || 0);
      const cpuUsages = performanceData.map(d => d.data.cpuUsage || 0);

      metrics.avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
      metrics.errorRate = errorRates.length > 0 ? 
        errorRates.reduce((a, b) => a + b, 0) / errorRates.length : 0;
      metrics.throughput = throughputs.length > 0 ? 
        throughputs.reduce((a, b) => a + b, 0) / throughputs.length : 0;
      metrics.memoryUsage = memoryUsages;
      metrics.cpuUsage = cpuUsages;
    }

    // Get slow operations
    const slowOperations = await FileActivity.find({
      userId,
      duration: { $gt: 5000 }, // operations taking more than 5 seconds
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .populate('fileId', 'name type')
    .sort({ duration: -1 })
    .limit(10);

    // Get error patterns
    const errorPatterns = await FileActivity.find({
      userId,
      success: false,
      timestamp: { $gte: startDate, $lte: endDate }
    })
    .sort({ timestamp: -1 })
    .limit(20);

    res.json({
      summary: {
        period,
        totalRequests: performanceData.length,
        metrics
      },
      slowOperations,
      errorPatterns,
      performanceData: performanceData.map(d => ({
        timestamp: d.timestamp,
        ...d.data
      }))
    });
  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({ message: 'Failed to get performance analytics', error: error.message });
  }
});

// Record activity (internal use)
router.post('/record-activity', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId, action, metadata = {}, duration, success = true, errorMessage } = req.body;

    const activity = new FileActivity({
      fileId,
      userId,
      action,
      metadata,
      duration,
      success,
      errorMessage,
      sessionId: req.sessionId,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    });

    await activity.save();
    res.status(201).json({ activity });
  } catch (error) {
    console.error('Record activity error:', error);
    res.status(500).json({ message: 'Failed to record activity', error: error.message });
  }
});

// Get user engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const userId = req.user._id;
    const { period = '30d' } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Session metrics
    const sessions = await Analytics.aggregate([
      {
        $match: {
          userId,
          type: 'engagement',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$sessionId',
          startTime: { $min: '$timestamp' },
          endTime: { $max: '$timestamp' },
          duration: { $sum: '$data.duration' },
          activities: { $sum: '$data.activities' },
          filesAccessed: { $addToSet: '$data.filesAccessed' }
        }
      },
      {
        $project: {
          sessionId: '$_id',
          startTime: 1,
          endTime: 1,
          duration: 1,
          activities: 1,
          filesAccessed: { $size: '$filesAccessed' }
        }
      }
    ]);

    // Calculate engagement metrics
    const totalSessions = sessions.length;
    const avgSessionDuration = sessions.length > 0 ? 
      sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length : 0;
    const totalActivities = sessions.reduce((sum, s) => sum + s.activities, 0);
    const avgActivitiesPerSession = sessions.length > 0 ? totalActivities / sessions.length : 0;

    // Daily engagement
    const dailyEngagement = await Analytics.aggregate([
      {
        $match: {
          userId,
          type: 'engagement',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$timestamp'
            }
          },
          sessions: { $sum: 1 },
          totalDuration: { $sum: '$data.duration' },
          totalActivities: { $sum: '$data.activities' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Feature usage
    const featureUsage = await Analytics.aggregate([
      {
        $match: {
          userId,
          type: 'engagement',
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $unwind: '$data.features'
      },
      {
        $group: {
          _id: '$features',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      summary: {
        period,
        totalSessions,
        avgSessionDuration,
        totalActivities,
        avgActivitiesPerSession
      },
      dailyEngagement,
      featureUsage
    });
  } catch (error) {
    console.error('Engagement analytics error:', error);
    res.status(500).json({ message: 'Failed to get engagement analytics', error: error.message });
  }
});

export default router;
