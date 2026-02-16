import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { FileTag } from '../models/FileTag.js';
import { File } from '../models/File.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all tags for a file
router.get('/file/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;

    // Verify file ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const tags = await FileTag.find({ fileId, userId })
      .sort({ createdAt: -1 });

    res.json({ tags });
  } catch (error) {
    console.error('Get file tags error:', error);
    res.status(500).json({ message: 'Failed to get tags', error: error.message });
  }
});

// Get all tags for user
router.get('/user', async (req, res) => {
  try {
    const userId = req.user._id;

    const tags = await FileTag.find({ userId })
      .populate('fileId', 'name type')
      .sort({ createdAt: -1 });

    // Group tags by name and count usage
    const tagGroups = tags.reduce((acc, tag) => {
      const tagName = tag.tag;
      if (!acc[tagName]) {
        acc[tagName] = {
          tag: tagName,
          color: tag.color,
          count: 0,
          files: []
        };
      }
      acc[tagName].count += 1;
      acc[tagName].files.push({
        id: tag.fileId._id,
        name: tag.fileId.name,
        type: tag.fileId.type
      });
      return acc;
    }, {});

    res.json({ tags: Object.values(tagGroups) });
  } catch (error) {
    console.error('Get user tags error:', error);
    res.status(500).json({ message: 'Failed to get tags', error: error.message });
  }
});

// Add tag to file
router.post('/file/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    const { tag, color = '#3B82F6' } = req.body;

    if (!tag || tag.trim().length === 0) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    // Verify file ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if tag already exists for this file
    const existingTag = await FileTag.findOne({
      fileId,
      userId,
      tag: tag.trim()
    });

    if (existingTag) {
      return res.status(400).json({ message: 'Tag already exists for this file' });
    }

    const newTag = new FileTag({
      fileId,
      userId,
      tag: tag.trim(),
      color
    });

    await newTag.save();

    res.status(201).json({ tag: newTag });
  } catch (error) {
    console.error('Add tag error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tag already exists for this file' });
    }
    res.status(500).json({ message: 'Failed to add tag', error: error.message });
  }
});

// Remove tag from file
router.delete('/file/:fileId/:tagId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId, tagId } = req.params;

    // Verify file ownership
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const deletedTag = await FileTag.findOneAndDelete({
      _id: tagId,
      fileId,
      userId
    });

    if (!deletedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag removed successfully' });
  } catch (error) {
    console.error('Remove tag error:', error);
    res.status(500).json({ message: 'Failed to remove tag', error: error.message });
  }
});

// Update tag
router.put('/:tagId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { tagId } = req.params;
    const { tag, color } = req.body;

    if (!tag || tag.trim().length === 0) {
      return res.status(400).json({ message: 'Tag name is required' });
    }

    const updatedTag = await FileTag.findOneAndUpdate(
      { _id: tagId, userId },
      { 
        tag: tag.trim(),
        color: color || '#3B82F6'
      },
      { new: true }
    );

    if (!updatedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ tag: updatedTag });
  } catch (error) {
    console.error('Update tag error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Tag already exists' });
    }
    res.status(500).json({ message: 'Failed to update tag', error: error.message });
  }
});

// Get files by tag
router.get('/tag/:tagName', async (req, res) => {
  try {
    const userId = req.user._id;
    const { tagName } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const tagFiles = await FileTag.find({ userId, tag: tagName })
      .populate('fileId')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const files = tagFiles.map(tag => tag.fileId).filter(file => file && !file.isDeleted);

    const totalCount = await FileTag.countDocuments({ userId, tag: tagName });

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get files by tag error:', error);
    res.status(500).json({ message: 'Failed to get files by tag', error: error.message });
  }
});

// Delete tag completely (from all files)
router.delete('/:tagId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { tagId } = req.params;

    const deletedTag = await FileTag.findOneAndDelete({
      _id: tagId,
      userId
    });

    if (!deletedTag) {
      return res.status(404).json({ message: 'Tag not found' });
    }

    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({ message: 'Failed to delete tag', error: error.message });
  }
});

export default router;
