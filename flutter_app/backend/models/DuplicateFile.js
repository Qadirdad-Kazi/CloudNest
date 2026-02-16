import mongoose from 'mongoose';

const duplicateFileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  originalFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  duplicateFileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  similarity: {
    type: Number,
    required: true,
    min: 0,
    max: 1,
  },
  algorithm: {
    type: String,
    required: true,
    enum: ['hash', 'content', 'visual', 'metadata', 'hybrid'],
  },
  hash: {
    type: String,
    required: true,
  },
  contentHash: {
    type: String,
    default: null,
  },
  visualHash: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'false_positive', 'reviewed'],
    default: 'pending',
  },
  action: {
    type: String,
    enum: ['none', 'delete_duplicate', 'merge', 'keep_both'],
    default: 'none',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: null,
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

// Indexes for efficient querying
duplicateFileSchema.index({ userId: 1, status: 1 });
duplicateFileSchema.index({ originalFileId: 1 });
duplicateFileSchema.index({ duplicateFileId: 1 });
duplicateFileSchema.index({ hash: 1 });
duplicateFileSchema.index({ similarity: -1 });
duplicateFileSchema.index({ algorithm: 1 });

export const DuplicateFile = mongoose.model('DuplicateFile', duplicateFileSchema);
