import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  parentPath: {
    type: String,
    default: '/',
  },
  category: {
    type: String,
    enum: ['images', 'documents', 'videos', 'audio', 'archives', 'code', 'others'],
    required: true,
  },
  isStarred: {
    type: Boolean,
    default: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
  lastAccessed: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  modifiedAt: {
    type: Date,
    default: Date.now,
  }
});

// Indexes for faster queries
fileSchema.index({ userId: 1, parentPath: 1 });
fileSchema.index({ userId: 1, isStarred: 1 });
fileSchema.index({ userId: 1, name: 'text' });
fileSchema.index({ userId: 1, category: 1 });
fileSchema.index({ userId: 1, isDeleted: 1 });
fileSchema.index({ userId: 1, lastAccessed: -1 });
fileSchema.index({ userId: 1, deletedAt: -1 });

// Update lastAccessed timestamp when file is accessed
fileSchema.methods.updateLastAccessed = function() {
  this.lastAccessed = new Date();
  return this.save();
};

export default mongoose.model('File', fileSchema);