import express from 'express';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import File from '../models/File.js';
import ActivityLog from '../models/ActivityLog.js';
import SystemMetric from '../models/SystemMetric.js';
import mongoose from 'mongoose';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Middleware to check if user is an admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    next();
  } catch (error) {
    console.error('Error in admin authorization:', error);
    res.status(500).json({ message: 'Server error during authorization' });
  }
};

// Apply admin check to all routes
router.use(isAdmin);

// Get system dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments();
    
    // Get active users in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await ActivityLog.distinct('userId', {
      timestamp: { $gte: sevenDaysAgo }
    }).countDocuments();
    
    // Get total files count
    const totalFiles = await File.countDocuments();
    
    // Get total storage used
    const storageAggregation = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: null, totalSize: { $sum: "$size" } } }
    ]);
    const totalStorage = storageAggregation.length > 0 ? storageAggregation[0].totalSize : 0;
    
    // Get files by type
    const filesByType = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get recent activity
    const recentActivity = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('userId', 'name email');
    
    res.json({
      totalUsers,
      activeUsers,
      totalFiles,
      totalStorage,
      filesByType,
      recentActivity
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard stats' });
  }
});

// Get user management data
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Execute query with pagination
    const users = await User.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('name email role createdAt lastLogin storageUsed storageLimit');
    
    // Get total count for pagination
    const totalUsers = await User.countDocuments(query);
    
    res.json({
      users,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
});

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, storageLimit, isActive } = req.body;
    
    // Find user
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (storageLimit) user.storageLimit = storageLimit;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      storageLimit: user.storageLimit,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }
    
    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Log activity
    const activityLog = new ActivityLog({
      userId: req.user._id,
      action: 'delete',
      resourceType: 'account',
      resourceId: id,
      details: `Admin deleted user: ${user.email}`
    });
    await activityLog.save();
    
    res.json({ message: 'User deleted successfully', id });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// Get storage analytics
router.get('/analytics/storage', async (req, res) => {
  try {
    // Get storage by file type
    const storageByType = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$type", totalSize: { $sum: "$size" }, count: { $sum: 1 } } },
      { $sort: { totalSize: -1 } }
    ]);
    
    // Get storage by user (top 10)
    const storageByUser = await File.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: "$userId", totalSize: { $sum: "$size" }, count: { $sum: 1 } } },
      { $sort: { totalSize: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { userId: '$_id', totalSize: 1, count: 1, userName: '$user.name', userEmail: '$user.email' } }
    ]);
    
    // Get storage growth over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const storageGrowth = await File.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSize: { $sum: "$size" },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      storageByType,
      storageByUser,
      storageGrowth
    });
  } catch (error) {
    console.error('Error getting storage analytics:', error);
    res.status(500).json({ message: 'Failed to get storage analytics' });
  }
});

// Get user activity analytics
router.get('/analytics/activity', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days));
    
    // Get activity by type
    const activityByType = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Get activity by day
    const activityByDay = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    // Get most active users
    const mostActiveUsers = await ActivityLog.aggregate([
      { $match: { timestamp: { $gte: daysAgo } } },
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { userId: '$_id', count: 1, userName: '$user.name', userEmail: '$user.email' } }
    ]);
    
    res.json({
      activityByType,
      activityByDay,
      mostActiveUsers
    });
  } catch (error) {
    console.error('Error getting activity analytics:', error);
    res.status(500).json({ message: 'Failed to get activity analytics' });
  }
});

// Get system health metrics
router.get('/system/health', async (req, res) => {
  try {
    // Get database stats
    const dbStats = await mongoose.connection.db.stats();
    
    // Get recent errors
    const recentErrors = await ActivityLog.find({ 
      action: 'error',
      timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .sort({ timestamp: -1 })
    .limit(10);
    
    // Get system metrics
    const systemMetrics = await SystemMetric.find({
      timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
    })
    .sort({ timestamp: 1 });
    
    res.json({
      dbStats: {
        collections: dbStats.collections,
        objects: dbStats.objects,
        dataSize: dbStats.dataSize,
        storageSize: dbStats.storageSize,
        indexes: dbStats.indexes,
        indexSize: dbStats.indexSize
      },
      recentErrors,
      systemMetrics
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ message: 'Failed to get system health' });
  }
});

// Record system metric
router.post('/system/metrics', async (req, res) => {
  try {
    const { metricType, value, label, metadata } = req.body;
    
    // Validate input
    if (!metricType || !value || !label) {
      return res.status(400).json({ message: 'Metric type, value, and label are required' });
    }
    
    // Create new metric
    const metric = new SystemMetric({
      metricType,
      value,
      label,
      metadata: metadata || {}
    });
    
    await metric.save();
    
    res.status(201).json(metric);
  } catch (error) {
    console.error('Error recording system metric:', error);
    res.status(500).json({ message: 'Failed to record system metric' });
  }
});

export default router;
