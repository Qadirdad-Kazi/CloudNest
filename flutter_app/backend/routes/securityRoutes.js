import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { SecurityAudit } from '../models/SecurityAudit.js';
import { TwoFactorAuth } from '../models/TwoFactorAuth.js';
import { AccessControl } from '../models/AccessControl.js';
import { DataRetentionPolicy } from '../models/DataRetentionPolicy.js';
import User from '../models/User.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import crypto from 'crypto';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Get security audit logs
router.get('/audit', async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      page = 1, 
      limit = 50, 
      action, 
      severity, 
      category, 
      startDate, 
      endDate,
      success 
    } = req.query;

    // Build query
    const query = { userId };
    
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (category) query.category = category;
    if (success !== undefined) query.success = success === 'true';
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const audits = await SecurityAudit.find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .lean();

    const totalCount = await SecurityAudit.countDocuments(query);

    res.json({
      audits,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Failed to get audit logs', error: error.message });
  }
});

// Get 2FA status
router.get('/2fa/status', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
    
    if (!twoFactorAuth) {
      return res.json({
        enabled: false,
        method: null,
        hasBackupCodes: false,
        trustedDevices: []
      });
    }

    res.json({
      enabled: twoFactorAuth.isEnabled,
      method: twoFactorAuth.method,
      hasBackupCodes: twoFactorAuth.backupCodes.length > 0,
      trustedDevices: twoFactorAuth.trustedDevices.filter(device => 
        device.expiresAt && device.expiresAt > new Date()
      )
    });
  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({ message: 'Failed to get 2FA status', error: error.message });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  try {
    const userId = req.user._id;
    const { method = 'totp', phoneNumber, email } = req.body;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `CloudNest (${req.user.email})`,
      issuer: 'CloudNest'
    });

    // Create or update 2FA record
    let twoFactorAuth = await TwoFactorAuth.findOne({ userId });
    
    if (twoFactorAuth) {
      twoFactorAuth.secret = secret.base32;
      twoFactorAuth.method = method;
      twoFactorAuth.phoneNumber = phoneNumber;
      twoFactorAuth.email = email;
      twoFactorAuth.backupCodes = generateBackupCodes();
    } else {
      twoFactorAuth = new TwoFactorAuth({
        userId,
        secret: secret.base32,
        method,
        phoneNumber,
        email,
        backupCodes: generateBackupCodes()
      });
    }

    await twoFactorAuth.save();

    // Generate QR code for TOTP
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    // Log security event
    await SecurityAudit.create({
      userId,
      action: '2fa_enabled',
      resource: '2fa',
      resourceId: twoFactorAuth._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'medium',
      category: 'authentication',
      metadata: { method }
    });

    res.json({
      secret: secret.base32,
      qrCode: qrCodeUrl,
      backupCodes: twoFactorAuth.backupCodes,
      method
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: 'Failed to enable 2FA', error: error.message });
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', async (req, res) => {
  try {
    const userId = req.user._id;
    const { token } = req.body;

    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
    
    if (!twoFactorAuth) {
      return res.status(400).json({ message: '2FA not set up' });
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret: twoFactorAuth.secret,
      encoding: 'base32',
      token: token.replace(/\s/g, '')
    });

    if (!verified) {
      // Increment failed attempts
      twoFactorAuth.failedAttempts += 1;
      
      if (twoFactorAuth.failedAttempts >= 5) {
        twoFactorAuth.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      }
      
      await twoFactorAuth.save();

      await SecurityAudit.create({
        userId,
        action: '2fa_failed',
        resource: '2fa',
        resourceId: twoFactorAuth._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        severity: 'medium',
        category: 'authentication',
        metadata: { failedAttempts: twoFactorAuth.failedAttempts }
      });

      return res.status(400).json({ message: 'Invalid token' });
    }

    // Enable 2FA
    twoFactorAuth.isEnabled = true;
    twoFactorAuth.failedAttempts = 0;
    twoFactorAuth.lockedUntil = null;
    await twoFactorAuth.save();

    // Update user
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: true });

    await SecurityAudit.create({
      userId,
      action: '2fa_enabled',
      resource: '2fa',
      resourceId: twoFactorAuth._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'medium',
      category: 'authentication'
    });

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: 'Failed to verify 2FA', error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, token } = req.body;

    // Verify password
    const user = await User.findById(userId);
    if (!user || !await user.comparePassword(password)) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // If 2FA is enabled, verify token
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
    if (twoFactorAuth && twoFactorAuth.isEnabled) {
      if (!token) {
        return res.status(400).json({ message: '2FA token required' });
      }

      const verified = speakeasy.totp.verify({
        secret: twoFactorAuth.secret,
        encoding: 'base32',
        token: token.replace(/\s/g, '')
      });

      if (!verified) {
        return res.status(400).json({ message: 'Invalid 2FA token' });
      }
    }

    // Disable 2FA
    if (twoFactorAuth) {
      twoFactorAuth.isEnabled = false;
      twoFactorAuth.backupCodes = [];
      twoFactorAuth.trustedDevices = [];
      await twoFactorAuth.save();
    }

    // Update user
    await User.findByIdAndUpdate(userId, { twoFactorEnabled: false });

    await SecurityAudit.create({
      userId,
      action: '2fa_disabled',
      resource: '2fa',
      resourceId: twoFactorAuth?._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'medium',
      category: 'authentication'
    });

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: 'Failed to disable 2FA', error: error.message });
  }
});

// Get access control permissions
router.get('/access-control', async (req, res) => {
  try {
    const userId = req.user._id;
    const { resource, resourceId } = req.query;

    const query = { userId };
    if (resource) query.resource = resource;
    if (resourceId) query.resourceId = resourceId;

    const permissions = await AccessControl.find(query)
      .populate('grantedBy', 'name email')
      .populate('userId', 'name email')
      .sort({ grantedAt: -1 });

    res.json({ permissions });
  } catch (error) {
    console.error('Get access control error:', error);
    res.status(500).json({ message: 'Failed to get access control', error: error.message });
  }
});

// Grant access control
router.post('/access-control/grant', async (req, res) => {
  try {
    const { targetUserId, resource, resourceId, permissions, expiresAt, conditions = {} } = req.body;
    const grantedBy = req.user._id;

    // Check if user has permission to grant
    const hasPermission = await checkPermission(grantedBy, resource, resourceId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const accessControl = new AccessControl({
      userId: targetUserId,
      resource,
      resourceId,
      permissions,
      grantedBy,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      conditions
    });

    await accessControl.save();

    await SecurityAudit.create({
      userId: grantedBy,
      action: 'permission_granted',
      resource,
      resourceId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'medium',
      category: 'authorization',
      metadata: {
        targetUserId,
        permissions,
        expiresAt
      }
    });

    res.status(201).json({ accessControl });
  } catch (error) {
    console.error('Grant access control error:', error);
    res.status(500).json({ message: 'Failed to grant access', error: error.message });
  }
});

// Revoke access control
router.post('/access-control/revoke/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const revokedBy = req.user._id;
    const { reason } = req.body;

    const accessControl = await AccessControl.findById(id);
    if (!accessControl) {
      return res.status(404).json({ message: 'Access control not found' });
    }

    // Check if user has permission to revoke
    const hasPermission = await checkPermission(revokedBy, accessControl.resource, accessControl.resourceId, 'admin');
    if (!hasPermission) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    accessControl.isActive = false;
    accessControl.revokedAt = new Date();
    accessControl.revokedBy = revokedBy;
    accessControl.reason = reason;
    await accessControl.save();

    await SecurityAudit.create({
      userId: revokedBy,
      action: 'permission_revoked',
      resource: accessControl.resource,
      resourceId: accessControl.resourceId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'medium',
      category: 'authorization',
      metadata: {
        targetUserId: accessControl.userId,
        permissions: accessControl.permissions,
        reason
      }
    });

    res.json({ message: 'Access revoked successfully' });
  } catch (error) {
    console.error('Revoke access control error:', error);
    res.status(500).json({ message: 'Failed to revoke access', error: error.message });
  }
});

// Get data retention policies
router.get('/retention-policies', async (req, res) => {
  try {
    const userId = req.user._id;
    const { policyType } = req.query;

    const query = { userId };
    if (policyType) query.policyType = policyType;

    const policies = await DataRetentionPolicy.find(query)
      .sort({ createdAt: -1 });

    res.json({ policies });
  } catch (error) {
    console.error('Get retention policies error:', error);
    res.status(500).json({ message: 'Failed to get retention policies', error: error.message });
  }
});

// Create data retention policy
router.post('/retention-policies', async (req, res) => {
  try {
    const userId = req.user._id;
    const policyData = req.body;

    const policy = new DataRetentionPolicy({
      userId,
      ...policyData
    });

    await policy.save();

    await SecurityAudit.create({
      userId,
      action: 'data_export',
      resource: 'retention_policy',
      resourceId: policy._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true,
      severity: 'low',
      category: 'system',
      metadata: { policyType: policy.policyType }
    });

    res.status(201).json({ policy });
  } catch (error) {
    console.error('Create retention policy error:', error);
    res.status(500).json({ message: 'Failed to create retention policy', error: error.message });
  }
});

// Get security summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get recent security events
    const recentEvents = await SecurityAudit.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);

    // Get 2FA status
    const twoFactorAuth = await TwoFactorAuth.findOne({ userId });

    // Get active permissions
    const activePermissions = await AccessControl.countDocuments({ 
      userId, 
      isActive: true 
    });

    // Get retention policies
    const retentionPolicies = await DataRetentionPolicy.countDocuments({ 
      userId, 
      isActive: true 
    });

    // Calculate security score
    const securityScore = calculateSecurityScore({
      has2FA: twoFactorAuth?.isEnabled || false,
      activePermissions,
      retentionPolicies,
      recentEvents: recentEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
    });

    res.json({
      summary: {
        securityScore,
        has2FA: twoFactorAuth?.isEnabled || false,
        activePermissions,
        retentionPolicies,
        recentEvents: recentEvents.length,
        criticalEvents: recentEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
      },
      recentEvents,
      recommendations: generateSecurityRecommendations({
        has2FA: twoFactorAuth?.isEnabled || false,
        securityScore,
        activePermissions,
        criticalEvents: recentEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length
      })
    });
  } catch (error) {
    console.error('Get security summary error:', error);
    res.status(500).json({ message: 'Failed to get security summary', error: error.message });
  }
});

// Helper functions
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
  }
  return codes;
}

async function checkPermission(userId, resource, resourceId, permission) {
  // Check if user is owner or has admin permission
  const accessControl = await AccessControl.findOne({
    userId,
    resource,
    resourceId,
    permissions: { $in: [permission, 'admin', 'owner'] },
    isActive: true,
    $or: [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ]
  });

  return !!accessControl;
}

function calculateSecurityScore({ has2FA, activePermissions, retentionPolicies, recentEvents }) {
  let score = 100;

  // 2FA enabled
  if (!has2FA) score -= 30;

  // Too many active permissions
  if (activePermissions > 20) score -= 10;
  else if (activePermissions > 10) score -= 5;

  // No retention policies
  if (retentionPolicies === 0) score -= 10;

  // Recent critical events
  if (recentEvents > 0) score -= recentEvents * 15;

  return Math.max(0, score);
}

function generateSecurityRecommendations({ has2FA, securityScore, activePermissions, criticalEvents }) {
  const recommendations = [];

  if (!has2FA) {
    recommendations.push({
      type: 'security',
      priority: 'high',
      title: 'Enable Two-Factor Authentication',
      description: 'Add an extra layer of security to your account with 2FA'
    });
  }

  if (securityScore < 70) {
    recommendations.push({
      type: 'security',
      priority: 'medium',
      title: 'Improve Security Score',
      description: 'Your security score is below 70. Consider reviewing your security settings.'
    });
  }

  if (activePermissions > 15) {
    recommendations.push({
      type: 'permissions',
      priority: 'medium',
      title: 'Review Active Permissions',
      description: 'You have many active permissions. Consider revoking unnecessary ones.'
    });
  }

  if (criticalEvents > 0) {
    recommendations.push({
      type: 'monitoring',
      priority: 'high',
      title: 'Review Security Events',
      description: 'You have recent critical security events. Review your audit logs.'
    });
  }

  return recommendations;
}

export default router;
