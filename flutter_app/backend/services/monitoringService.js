import os from 'os';
import mongoose from 'mongoose';
import SystemMetric from '../models/SystemMetric.js';
import File from '../models/File.js';
import User from '../models/User.js';

/**
 * Service to monitor system health and collect metrics
 */
class MonitoringService {
  constructor() {
    this.intervalId = null;
    this.metricsInterval = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Start collecting system metrics
   */
  start() {
    console.log('Starting system monitoring service');
    this.collectMetrics(); // Collect immediately
    
    // Then collect at regular intervals
    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, this.metricsInterval);
  }

  /**
   * Stop collecting system metrics
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Stopped system monitoring service');
    }
  }

  /**
   * Collect various system metrics
   */
  async collectMetrics() {
    try {
      const timestamp = new Date();
      
      // Collect system metrics
      await this.collectSystemMetrics(timestamp);
      
      // Collect storage metrics
      await this.collectStorageMetrics(timestamp);
      
      // Collect user metrics
      await this.collectUserMetrics(timestamp);
      
      // Collect database metrics
      await this.collectDatabaseMetrics(timestamp);
      
      console.log(`Collected system metrics at ${timestamp.toISOString()}`);
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Collect OS and hardware metrics
   */
  async collectSystemMetrics(timestamp) {
    // CPU Load
    const cpuLoad = os.loadavg()[0]; // 1 minute load average
    await this.saveMetric('performance', cpuLoad, 'CPU Load (1m)', timestamp);
    
    // Memory usage
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    await this.saveMetric('performance', memoryUsagePercent, 'Memory Usage (%)', timestamp, {
      totalMemory,
      freeMemory,
      usedMemory
    });
    
    // Uptime
    const uptime = os.uptime();
    await this.saveMetric('performance', uptime, 'System Uptime (s)', timestamp);
  }

  /**
   * Collect storage metrics
   */
  async collectStorageMetrics(timestamp) {
    // Total storage used
    const storageAggregation = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]);
    
    const totalStorage = storageAggregation.length > 0 ? storageAggregation[0].totalSize : 0;
    await this.saveMetric('storage', totalStorage, 'Total Storage Used (bytes)', timestamp);
    
    // Storage by file type
    const storageByType = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$type", totalSize: { $sum: "$size" }, count: { $sum: 1 } } }
    ]);
    
    for (const type of storageByType) {
      await this.saveMetric('storage', type.totalSize, `Storage for ${type._id || 'unknown'} (bytes)`, timestamp, {
        fileType: type._id,
        fileCount: type.count
      });
    }
    
    // Files in trash
    const trashCount = await File.countDocuments({ isDeleted: true });
    await this.saveMetric('files', trashCount, 'Files in Trash', timestamp);
    
    // Total files
    const totalFiles = await File.countDocuments();
    await this.saveMetric('files', totalFiles, 'Total Files', timestamp);
  }

  /**
   * Collect user metrics
   */
  async collectUserMetrics(timestamp) {
    // Total users
    const totalUsers = await User.countDocuments();
    await this.saveMetric('users', totalUsers, 'Total Users', timestamp);
    
    // Active users in last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const activeUsersCount = await User.countDocuments({
      lastLogin: { $gte: oneDayAgo }
    });
    
    await this.saveMetric('users', activeUsersCount, 'Active Users (24h)', timestamp);
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics(timestamp) {
    try {
      // Get database stats
      const dbStats = await mongoose.connection.db.stats();
      
      await this.saveMetric('performance', dbStats.dataSize, 'Database Size (bytes)', timestamp);
      await this.saveMetric('performance', dbStats.objects, 'Database Objects', timestamp);
      await this.saveMetric('performance', dbStats.collections, 'Database Collections', timestamp);
      await this.saveMetric('performance', dbStats.indexes, 'Database Indexes', timestamp);
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  }

  /**
   * Save a metric to the database
   */
  async saveMetric(metricType, value, label, timestamp, metadata = {}) {
    const metric = new SystemMetric({
      metricType,
      value,
      label,
      timestamp,
      metadata
    });
    
    await metric.save();
  }
}

export default new MonitoringService();
