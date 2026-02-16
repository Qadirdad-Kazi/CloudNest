import mongoose from 'mongoose';

const fileActivitySchema = new mongoose.Schema({
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
  action: {
    type: String,
    required: true,
    enum: ['view', 'download', 'upload', 'delete', 'share', 'rename', 'move', 'copy', 'preview'],
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  sessionId: {
    type: String,
    default: null,
  },
  userAgent: {
    type: String,
    default: null,
  },
  ipAddress: {
    type: String,
    default: null,
  },
  duration: {
    type: Number, // in milliseconds
    default: null,
  },
  success: {
    type: Boolean,
    default: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
});

// Indexes for efficient querying
fileActivitySchema.index({ fileId: 1, timestamp: -1 });
fileActivitySchema.index({ userId: 1, timestamp: -1 });
fileActivitySchema.index({ userId: 1, action: 1, timestamp: -1 });
fileActivitySchema.index({ action: 1, timestamp: -1 });
fileActivitySchema.index({ timestamp: -1 });

export const FileActivity = mongoose.model('FileActivity', fileActivitySchema);
