import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { FileComment } from '../models/FileComment.js';
import { File } from '../models/File.js';
import { User } from '../models/User.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all comments for a file
router.get('/file/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    // Verify file access
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Build sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const comments = await FileComment.find({ fileId, parentComment: null })
      .populate('userId', 'name email avatar')
      .populate('mentions', 'name email')
      .populate('replies')
      .populate('resolvedBy', 'name email')
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Get total count
    const totalCount = await FileComment.countDocuments({ fileId, parentComment: null });

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Failed to get comments', error: error.message });
  }
});

// Add comment to file
router.post('/file/:fileId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { fileId } = req.params;
    const { content, mentions = [], parentComment = null } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    // Verify file access
    const file = await File.findOne({ _id: fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Validate mentions
    if (mentions.length > 0) {
      const validUsers = await User.find({ _id: { $in: mentions } });
      if (validUsers.length !== mentions.length) {
        return res.status(400).json({ message: 'Invalid user mentions' });
      }
    }

    const newComment = new FileComment({
      fileId,
      userId,
      content: content.trim(),
      mentions,
      parentComment
    });

    await newComment.save();

    // If it's a reply, update parent comment
    if (parentComment) {
      await FileComment.findByIdAndUpdate(
        parentComment,
        { $push: { replies: newComment._id } }
      );
    }

    // Populate user data
    await newComment.populate('userId', 'name email avatar');
    await newComment.populate('mentions', 'name email');

    res.status(201).json({ comment: newComment });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Failed to add comment', error: error.message });
  }
});

// Update comment
router.put('/:commentId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const { content, mentions = [] } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    const comment = await FileComment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Validate mentions
    if (mentions.length > 0) {
      const validUsers = await User.find({ _id: { $in: mentions } });
      if (validUsers.length !== mentions.length) {
        return res.status(400).json({ message: 'Invalid user mentions' });
      }
    }

    const updatedComment = await FileComment.findByIdAndUpdate(
      commentId,
      {
        content: content.trim(),
        mentions,
        isEdited: true,
        editedAt: new Date()
      },
      { new: true }
    ).populate('userId', 'name email avatar')
     .populate('mentions', 'name email');

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Failed to update comment', error: error.message });
  }
});

// Delete comment
router.delete('/:commentId', async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;

    const comment = await FileComment.findOne({ _id: commentId, userId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // If it has replies, soft delete by marking content
    const hasReplies = await FileComment.countDocuments({ parentComment: commentId });
    
    if (hasReplies > 0) {
      await FileComment.findByIdAndUpdate(
        commentId,
        {
          content: '[This comment has been deleted]',
          isEdited: true,
          editedAt: new Date()
        }
      );
    } else {
      // If it's a reply, remove from parent's replies array
      if (comment.parentComment) {
        await FileComment.findByIdAndUpdate(
          comment.parentComment,
          { $pull: { replies: commentId } }
        );
      }
      
      // Delete all replies
      await FileComment.deleteMany({ parentComment: commentId });
      
      // Delete the comment
      await FileComment.findByIdAndDelete(commentId);
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Failed to delete comment', error: error.message });
  }
});

// Resolve/unresolve comment
router.patch('/:commentId/resolve', async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentId } = req.params;
    const { isResolved = true } = req.body;

    const comment = await FileComment.findOne({ _id: commentId });
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Verify file access
    const file = await File.findOne({ _id: comment.fileId, userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    const updatedComment = await FileComment.findByIdAndUpdate(
      commentId,
      {
        isResolved,
        resolvedBy: isResolved ? userId : null,
        resolvedAt: isResolved ? new Date() : null
      },
      { new: true }
    ).populate('resolvedBy', 'name email');

    res.json({ comment: updatedComment });
  } catch (error) {
    console.error('Resolve comment error:', error);
    res.status(500).json({ message: 'Failed to resolve comment', error: error.message });
  }
});

// Get comments where user is mentioned
router.get('/mentions', async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20, unread = false } = req.query;

    const query = { mentions: userId };
    
    if (unread === 'true') {
      query.isRead = false;
    }

    const comments = await FileComment.find(query)
      .populate('userId', 'name email avatar')
      .populate('fileId', 'name type')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalCount = await FileComment.countDocuments(query);

    res.json({
      comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get mentions error:', error);
    res.status(500).json({ message: 'Failed to get mentions', error: error.message });
  }
});

// Mark mentions as read
router.patch('/mentions/read', async (req, res) => {
  try {
    const userId = req.user._id;
    const { commentIds } = req.body;

    await FileComment.updateMany(
      { _id: { $in: commentIds }, mentions: userId },
      { $addToSet: { readBy: userId } }
    );

    res.json({ message: 'Mentions marked as read' });
  } catch (error) {
    console.error('Mark mentions read error:', error);
    res.status(500).json({ message: 'Failed to mark mentions as read', error: error.message });
  }
});

export default router;
