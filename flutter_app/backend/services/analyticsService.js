import { Analytics } from '../models/Analytics.js';
import { FileActivity } from '../models/FileActivity.js';
import { File } from '../models/File.js';
import User from '../models/User.js';

class AnalyticsService {
  // Record file activity
  static async recordActivity({
    userId,
    fileId,
    action,
    metadata = {},
    duration = null,
    success = true,
    errorMessage = null,
    sessionId = null,
    userAgent = null,
    ipAddress = null
  }) {
    try {
      const activity = new FileActivity({
        fileId,
        userId,
        action,
        metadata,
        duration,
        success,
        errorMessage,
        sessionId,
        userAgent,
        ipAddress
      });

      await activity.save();
      return activity;
    } catch (error) {
      console.error('Failed to record activity:', error);
      throw error;
    }
  }

  // Record storage analytics
  static async recordStorageAnalytics(userId) {
    try {
      const files = await File.find({ userId, isDeleted: false });
      
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const fileCount = files.length;
      
      // Group by type
      const filesByType = files.reduce((acc, file) => {
        const type = file.type.split('/')[0] || 'other';
        if (!acc[type]) {
          acc[type] = { count: 0, size: 0 };
        }
        acc[type].count++;
        acc[type].size += file.size;
        return acc;
      }, {});

      const analytics = new Analytics({
        userId,
        type: 'storage',
        data: {
          totalSize,
          fileCount,
          filesByType,
          dailySize: totalSize,
          dailyFileCount: fileCount
        },
        timestamp: new Date()
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Failed to record storage analytics:', error);
      throw error;
    }
  }

  // Record performance metrics
  static async recordPerformanceMetrics(userId, metrics) {
    try {
      const analytics = new Analytics({
        userId,
        type: 'performance',
        data: {
          ...metrics,
          timestamp: new Date()
        },
        timestamp: new Date()
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Failed to record performance metrics:', error);
      throw error;
    }
  }

  // Record engagement metrics
  static async recordEngagementMetrics(userId, metrics) {
    try {
      const analytics = new Analytics({
        userId,
        type: 'engagement',
        data: {
          ...metrics,
          timestamp: new Date()
        },
        timestamp: new Date()
      });

      await analytics.save();
      return analytics;
    } catch (error) {
      console.error('Failed to record engagement metrics:', error);
      throw error;
    }
  }

  // Get user activity summary
  static async getUserActivitySummary(userId, period = '30d') {
    try {
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

      const activities = await FileActivity.find({
        userId,
        timestamp: { $gte: startDate, $lte: endDate }
      });

      const summary = {
        totalActivities: activities.length,
        period,
        activitiesByType: activities.reduce((acc, activity) => {
          acc[activity.action] = (acc[activity.action] || 0) + 1;
          return acc;
        }, {}),
        avgDuration: activities.length > 0 ? 
          activities.reduce((sum, a) => sum + (a.duration || 0), 0) / activities.length : 0,
        successRate: activities.length > 0 ? 
          activities.filter(a => a.success).length / activities.length : 0
      };

      return summary;
    } catch (error) {
      console.error('Failed to get user activity summary:', error);
      throw error;
    }
  }

  // Get storage trends
  static async getStorageTrends(userId, period = '30d') {
    try {
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

      const trends = await Analytics.aggregate([
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

      return trends;
    } catch (error) {
      console.error('Failed to get storage trends:', error);
      throw error;
    }
  }

  // Get performance summary
  static async getPerformanceSummary(userId, period = '24h') {
    try {
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
        default:
          startDate.setDate(startDate.getDate() - 1);
      }

      const performanceData = await Analytics.find({
        userId,
        type: 'performance',
        timestamp: { $gte: startDate, $lte: endDate }
      });

      const summary = {
        period,
        totalRequests: performanceData.length,
        avgResponseTime: performanceData.length > 0 ? 
          performanceData.reduce((sum, d) => sum + (d.data.responseTime || 0), 0) / performanceData.length : 0,
        errorRate: performanceData.length > 0 ? 
          performanceData.reduce((sum, d) => sum + (d.data.errorRate || 0), 0) / performanceData.length : 0,
        throughput: performanceData.length > 0 ? 
          performanceData.reduce((sum, d) => sum + (d.data.throughput || 0), 0) / performanceData.length : 0
      };

      return summary;
    } catch (error) {
      console.error('Failed to get performance summary:', error);
      throw error;
    }
  }

  // Get engagement summary
  static async getEngagementSummary(userId, period = '30d') {
    try {
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

      const engagementData = await Analytics.find({
        userId,
        type: 'engagement',
        timestamp: { $gte: startDate, $lte: endDate }
      });

      const summary = {
        period,
        totalSessions: engagementData.length,
        avgSessionDuration: engagementData.length > 0 ? 
          engagementData.reduce((sum, d) => sum + (d.data.duration || 0), 0) / engagementData.length : 0,
        totalActivities: engagementData.reduce((sum, d) => sum + (d.data.activities || 0), 0),
        avgActivitiesPerSession: engagementData.length > 0 ? 
          engagementData.reduce((sum, d) => sum + (d.data.activities || 0), 0) / engagementData.length : 0
      };

      return summary;
    } catch (error) {
      console.error('Failed to get engagement summary:', error);
      throw error;
    }
  }

  // Clean up old analytics data
  static async cleanupOldData(retentionDays = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete old file activities
      await FileActivity.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      // Delete old analytics
      await Analytics.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`Cleaned up analytics data older than ${retentionDays} days`);
    } catch (error) {
      console.error('Failed to cleanup old analytics data:', error);
      throw error;
    }
  }

  // Generate analytics report
  static async generateReport(userId, reportType = 'comprehensive') {
    try {
      const reports = {};

      switch (reportType) {
        case 'storage':
          reports.storage = await this.getStorageTrends(userId);
          break;
        case 'activity':
          reports.activity = await this.getUserActivitySummary(userId);
          break;
        case 'performance':
          reports.performance = await this.getPerformanceSummary(userId);
          break;
        case 'engagement':
          reports.engagement = await this.getEngagementSummary(userId);
          break;
        case 'comprehensive':
          reports.storage = await this.getStorageTrends(userId);
          reports.activity = await this.getUserActivitySummary(userId);
          reports.performance = await this.getPerformanceSummary(userId);
          reports.engagement = await this.getEngagementSummary(userId);
          break;
      }

      return {
        userId,
        reportType,
        generatedAt: new Date(),
        period: '30d',
        reports
      };
    } catch (error) {
      console.error('Failed to generate analytics report:', error);
      throw error;
    }
  }
}

export default AnalyticsService;
