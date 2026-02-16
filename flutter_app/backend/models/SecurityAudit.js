import mongoose from 'mongoose';

const securityAuditSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login', 'logout', 'login_failed', 'password_change', 'password_reset',
      '2fa_enabled', '2fa_disabled', '2fa_failed', 'api_key_created', 'api_key_revoked',
      'file_access', 'file_upload', 'file_download', 'file_delete', 'file_share',
      'permission_granted', 'permission_revoked', 'admin_access', 'security_breach',
      'suspicious_activity', 'data_export', 'data_import', 'account_locked', 'account_unlocked'
    ],
  },
  resource: {
    type: String,
    default: null,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
    default: null,
  },
  sessionId: {
    type: String,
    default: null,
  },
  success: {
    type: Boolean,
    required: true,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  category: {
    type: String,
    enum: ['authentication', 'authorization', 'data_access', 'system', 'user_action'],
    default: 'user_action',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient querying
securityAuditSchema.index({ userId: 1, timestamp: -1 });
securityAuditSchema.index({ action: 1, timestamp: -1 });
securityAuditSchema.index({ severity: 1, timestamp: -1 });
securityAuditSchema.index({ category: 1, timestamp: -1 });
securityAuditSchema.index({ ipAddress: 1, timestamp: -1 });
securityAuditSchema.index({ success: 1, timestamp: -1 });

export const SecurityAudit = mongoose.model('SecurityAudit', securityAuditSchema);
