import mongoose from 'mongoose';

const dataRetentionPolicySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  policyType: {
    type: String,
    required: true,
    enum: ['file_retention', 'audit_log_retention', 'session_retention', 'backup_retention', 'cache_retention'],
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rules: [{
    resourceType: {
      type: String,
      required: true,
      enum: ['file', 'folder', 'audit_log', 'session', 'backup', 'cache'],
    },
    conditions: {
      age: {
        type: Number,
        default: null, // in days
      },
      size: {
        type: Number,
        default: null, // in bytes
      },
      accessFrequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'never'],
        default: null,
      },
      lastAccessed: {
        type: Number,
        default: null, // in days
      },
      tags: [String],
      customConditions: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    action: {
      type: String,
      required: true,
      enum: ['delete', 'archive', 'compress', 'move', 'notify', 'encrypt'],
    },
    destination: {
      type: String,
      default: null, // for move/archive actions
    },
    schedule: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
      default: 'monthly',
    },
    exceptions: [{
      condition: String,
      value: mongoose.Schema.Types.Mixed,
      action: String,
    }],
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastRun: {
    type: Date,
    default: null,
  },
  nextRun: {
    type: Date,
    default: null,
  },
  statistics: {
    totalProcessed: {
      type: Number,
      default: 0,
    },
    totalDeleted: {
      type: Number,
      default: 0,
    },
    totalArchived: {
      type: Number,
      default: 0,
    },
    totalCompressed: {
      type: Number,
      default: 0,
    },
    lastProcessedAt: {
      type: Date,
      default: null,
    },
  },
});

// Indexes for efficient querying
dataRetentionPolicySchema.index({ userId: 1, policyType: 1 });
dataRetentionPolicySchema.index({ isActive: 1, nextRun: 1 });
dataRetentionPolicySchema.index({ 'rules.resourceType': 1 });

export const DataRetentionPolicy = mongoose.model('DataRetentionPolicy', dataRetentionPolicySchema);
