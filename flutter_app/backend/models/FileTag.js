import mongoose from 'mongoose';

const fileTagSchema = new mongoose.Schema({
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
  tag: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  color: {
    type: String,
    default: '#3B82F6',
    match: /^#[0-9A-F]{6}$/i,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index to ensure unique tags per file per user
fileTagSchema.index({ fileId: 1, userId: 1, tag: 1 }, { unique: true });

// Index for finding files by tags
fileTagSchema.index({ userId: 1, tag: 1 });

// Index for finding tags by file
fileTagSchema.index({ fileId: 1 });

export const FileTag = mongoose.model('FileTag', fileTagSchema);
