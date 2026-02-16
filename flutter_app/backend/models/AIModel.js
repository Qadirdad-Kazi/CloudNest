import mongoose from 'mongoose';

const aiModelSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  modelType: {
    type: String,
    required: true,
    enum: ['file_organization', 'image_recognition', 'duplicate_detection', 'content_search', 'smart_suggestions'],
  },
  modelVersion: {
    type: String,
    required: true,
    default: '1.0',
  },
  trainingData: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  accuracy: {
    type: Number,
    default: 0,
    min: 0,
    max: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastTrained: {
    type: Date,
    default: null,
  },
  trainingCount: {
    type: Number,
    default: 0,
  },
  performance: {
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
aiModelSchema.index({ userId: 1, modelType: 1 });
aiModelSchema.index({ isActive: 1 });
aiModelSchema.index({ lastTrained: -1 });

export const AIModel = mongoose.model('AIModel', aiModelSchema);
