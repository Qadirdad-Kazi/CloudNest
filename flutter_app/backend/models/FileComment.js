import mongoose from 'mongoose';

const fileCommentSchema = new mongoose.Schema({
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileComment',
    default: null,
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileComment',
  }],
  isResolved: {
    type: Boolean,
    default: false,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  resolvedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for finding comments by file
fileCommentSchema.index({ fileId: 1, createdAt: 1 });

// Index for finding comments by user
fileCommentSchema.index({ userId: 1 });

// Index for finding parent comments
fileCommentSchema.index({ parentComment: 1 });

// Index for finding unresolved comments
fileCommentSchema.index({ fileId: 1, isResolved: 1 });

export const FileComment = mongoose.model('FileComment', fileCommentSchema);
