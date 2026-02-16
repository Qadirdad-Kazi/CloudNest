import mongoose from 'mongoose';

const accessControlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resource: {
    type: String,
    required: true,
    enum: ['file', 'folder', 'share_link', 'user', 'system', 'analytics', 'settings'],
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  permissions: [{
    type: String,
    enum: ['read', 'write', 'delete', 'share', 'admin', 'owner'],
    required: true,
  }],
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  grantedAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  lastAccessed: {
    type: Date,
    default: null,
  },
  accessCount: {
    type: Number,
    default: 0,
  },
  revokedAt: {
    type: Date,
    default: null,
  },
  revokedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  reason: {
    type: String,
    default: null,
  },
});

// Indexes for efficient querying
accessControlSchema.index({ userId: 1, resource: 1, resourceId: 1 });
accessControlSchema.index({ resource: 1, resourceId: 1 });
accessControlSchema.index({ grantedBy: 1 });
accessControlSchema.index({ isActive: 1, expiresAt: 1 });
accessControlSchema.index({ permissions: 1 });

export const AccessControl = mongoose.model('AccessControl', accessControlSchema);
