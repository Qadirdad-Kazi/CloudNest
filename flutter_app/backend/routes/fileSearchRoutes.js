import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { File } from '../models/File.js';
import { Folder } from '../models/Folder.js';
import { FileTag } from '../models/FileTag.js';
import User from '../models/User.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Advanced search with filters
router.post('/search', async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      query,
      fileTypes = [],
      tags = [],
      dateRange = { start: null, end: null },
      sizeRange = { min: 0, max: 1000000000 }, // 1GB default max
      starred = null,
      path = '/',
      sortBy = 'relevance',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.body;

    // Build search query
    const searchQuery = {
      userId,
      isDeleted: false,
      parentPath: path === '/' ? { $in: ['/', ''] } : path,
    };

    // Text search
    if (query && query.trim()) {
      searchQuery.$text = { $search: query.trim() };
    }

    // File type filter
    if (fileTypes.length > 0) {
      searchQuery.type = { $in: fileTypes };
    }

    // Starred filter
    if (starred !== null) {
      searchQuery.isStarred = starred;
    }

    // Size range filter
    searchQuery.size = {
      $gte: sizeRange.min || 0,
      $lte: sizeRange.max || 1000000000
    };

    // Date range filter
    if (dateRange.start || dateRange.end) {
      searchQuery.createdAt = {};
      if (dateRange.start) {
        searchQuery.createdAt.$gte = new Date(dateRange.start);
      }
      if (dateRange.end) {
        searchQuery.createdAt.$lte = new Date(dateRange.end);
      }
    }

    // Tag filter - get files with specified tags
    let taggedFileIds = [];
    if (tags.length > 0) {
      const tagFiles = await FileTag.find({
        userId,
        tag: { $in: tags }
      }).distinct('fileId');
      taggedFileIds = tagFiles;
    }

    // If tags are specified, filter by tagged files
    if (taggedFileIds.length > 0) {
      searchQuery._id = { $in: taggedFileIds };
    }

    // Sort options
    let sortOptions = {};
    switch (sortBy) {
      case 'name':
        sortOptions = { name: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'size':
        sortOptions = { size: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'date':
        sortOptions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'modified':
        sortOptions = { modifiedAt: sortOrder === 'asc' ? 1 : -1 };
        break;
      case 'relevance':
      default:
        if (query && query.trim()) {
          sortOptions = { score: { $meta: 'textScore' } };
        } else {
          sortOptions = { createdAt: -1 };
        }
        break;
    }

    // Execute search
    const files = await File.find(searchQuery)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('userId', 'name email')
      .lean();

    // Get total count for pagination
    const totalCount = await File.countDocuments(searchQuery);

    // Add tags to each file
    const filesWithTags = await Promise.all(
      files.map(async (file) => {
        const fileTags = await FileTag.find({ fileId: file._id });
        return {
          ...file,
          tags: fileTags.map(tag => ({
            id: tag._id,
            tag: tag.tag,
            color: tag.color
          }))
        };
      })
    );

    res.json({
      files: filesWithTags,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      filters: {
        query,
        fileTypes,
        tags,
        dateRange,
        sizeRange,
        starred,
        path,
        sortBy,
        sortOrder
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get search suggestions/autocomplete
router.get('/suggestions', async (req, res) => {
  try {
    const userId = req.user._id;
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.json({ suggestions: [] });
    }

    // Search in file names and paths
    const nameSuggestions = await File.find({
      userId,
      isDeleted: false,
      name: { $regex: query.trim(), $options: 'i' }
    })
    .select('name path type')
    .limit(parseInt(limit))
    .lean();

    // Search in tags
    const tagSuggestions = await FileTag.find({
      userId,
      tag: { $regex: query.trim(), $options: 'i' }
    })
    .select('tag color')
    .limit(parseInt(limit))
    .lean();

    res.json({
      suggestions: {
        files: nameSuggestions,
        tags: tagSuggestions
      }
    });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ message: 'Failed to get suggestions', error: error.message });
  }
});

// Get popular tags for user
router.get('/popular-tags', async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;

    const popularTags = await FileTag.aggregate([
      { $match: { userId } },
      { $group: { _id: '$tag', count: { $sum: 1 }, color: { $first: '$color' } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json({ tags: popularTags });
  } catch (error) {
    console.error('Popular tags error:', error);
    res.status(500).json({ message: 'Failed to get popular tags', error: error.message });
  }
});

// Search within specific folder
router.post('/folder-search', async (req, res) => {
  try {
    const userId = req.user._id;
    const { folderId, query, includeSubfolders = false } = req.body;

    // Get folder path
    const folder = await Folder.findOne({ _id: folderId, userId });
    if (!folder) {
      return res.status(404).json({ message: 'Folder not found' });
    }

    let searchPaths = [folder.path];
    if (includeSubfolders) {
      // Get all subfolder paths
      const subfolders = await Folder.find({
        userId,
        path: { $regex: `^${folder.path}/`, $options: 'i' },
        isDeleted: false
      }).select('path');
      searchPaths = subfolders.map(f => f.path);
    }

    const searchQuery = {
      userId,
      isDeleted: false,
      parentPath: { $in: searchPaths }
    };

    if (query && query.trim()) {
      searchQuery.$text = { $search: query.trim() };
    }

    const files = await File.find(searchQuery)
      .sort({ score: { $meta: 'textScore' } })
      .populate('userId', 'name email')
      .lean();

    res.json({ files });
  } catch (error) {
    console.error('Folder search error:', error);
    res.status(500).json({ message: 'Folder search failed', error: error.message });
  }
});

export default router;
