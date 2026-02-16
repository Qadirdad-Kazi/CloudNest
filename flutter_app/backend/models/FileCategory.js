import mongoose from 'mongoose';

const fileCategorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    required: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  subcategory: {
    type: String,
    trim: true,
    default: null,
  },
  confidence: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  autoCategorized: {
    type: Boolean,
    default: true,
  },
  manualOverride: {
    type: Boolean,
    default: false,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
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
fileCategorySchema.index({ userId: 1, category: 1 });
fileCategorySchema.index({ fileId: 1 });
fileCategorySchema.index({ autoCategorized: 1 });
fileCategorySchema.index({ confidence: -1 });

export const FileCategory = mongoose.model('FileCategory', fileCategorySchema);
