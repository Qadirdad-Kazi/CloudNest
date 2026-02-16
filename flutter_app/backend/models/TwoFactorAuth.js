import mongoose from 'mongoose';

const twoFactorAuthSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  secret: {
    type: String,
    required: true,
  },
  backupCodes: {
    type: [String],
    default: [],
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  method: {
    type: String,
    enum: ['totp', 'sms', 'email', 'authenticator'],
    default: 'totp',
  },
  phoneNumber: {
    type: String,
    default: null,
  },
  email: {
    type: String,
    default: null,
  },
  lastUsed: {
    type: Date,
    default: null,
  },
  failedAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: {
    type: Date,
    default: null,
  },
  recoveryCodes: {
    type: [String],
    default: [],
  },
  trustedDevices: [{
    deviceId: String,
    deviceName: String,
    userAgent: String,
    ipAddress: String,
    addedAt: {
      type: Date,
      default: Date.now,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
  }],
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
twoFactorAuthSchema.index({ userId: 1 });
twoFactorAuthSchema.index({ isEnabled: 1 });
twoFactorAuthSchema.index({ 'trustedDevices.expiresAt': 1 });

export const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
