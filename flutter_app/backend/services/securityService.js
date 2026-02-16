import { SecurityAudit } from '../models/SecurityAudit.js';
import { TwoFactorAuth } from '../models/TwoFactorAuth.js';
import { AccessControl } from '../models/AccessControl.js';
import { DataRetentionPolicy } from '../models/DataRetentionPolicy.js';
import User from '../models/User.js';
import { File } from '../models/File.js';
import speakeasy from 'speakeasy';
import crypto from 'crypto';

class SecurityService {
  // Record security audit event
  static async recordAuditEvent({
    userId,
    action,
    resource = null,
    resourceId = null,
    ipAddress,
    userAgent = null,
    sessionId = null,
    success = true,
    errorMessage = null,
    metadata = {},
    severity = 'low',
    category = 'user_action'
  }) {
    try {
      const audit = new SecurityAudit({
        userId,
        action,
        resource,
        resourceId,
        ipAddress,
        userAgent,
        sessionId,
        success,
        errorMessage,
        metadata,
        severity,
        category
      });

      await audit.save();
      return audit;
    } catch (error) {
      console.error('Failed to record audit event:', error);
      throw error;
    }
  }

  // Check if user has permission
  static async hasPermission(userId, resource, resourceId, permission) {
    try {
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
    } catch (error) {
      console.error('Failed to check permission:', error);
      return false;
    }
  }

  // Grant permission to user
  static async grantPermission({
    userId,
    targetUserId,
    resource,
    resourceId,
    permissions,
    grantedBy,
    expiresAt = null,
    conditions = {}
  }) {
    try {
      // Check if granter has permission
      const hasPermission = await this.hasPermission(grantedBy, resource, resourceId, 'admin');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to grant access');
      }

      const accessControl = new AccessControl({
        userId: targetUserId,
        resource,
        resourceId,
        permissions,
        grantedBy,
        expiresAt,
        conditions
      });

      await accessControl.save();

      // Record audit event
      await this.recordAuditEvent({
        userId: grantedBy,
        action: 'permission_granted',
        resource,
        resourceId,
        ipAddress: null, // Should be provided by caller
        userAgent: null,
        success: true,
        severity: 'medium',
        category: 'authorization',
        metadata: {
          targetUserId,
          permissions,
          expiresAt
        }
      });

      return accessControl;
    } catch (error) {
      console.error('Failed to grant permission:', error);
      throw error;
    }
  }

  // Revoke permission from user
  static async revokePermission(accessControlId, revokedBy, reason = '') {
    try {
      const accessControl = await AccessControl.findById(accessControlId);
      if (!accessControl) {
        throw new Error('Access control not found');
      }

      // Check if revoker has permission
      const hasPermission = await this.hasPermission(revokedBy, accessControl.resource, accessControl.resourceId, 'admin');
      if (!hasPermission) {
        throw new Error('Insufficient permissions to revoke access');
      }

      accessControl.isActive = false;
      accessControl.revokedAt = new Date();
      accessControl.revokedBy = revokedBy;
      accessControl.reason = reason;
      await accessControl.save();

      // Record audit event
      await this.recordAuditEvent({
        userId: revokedBy,
        action: 'permission_revoked',
        resource: accessControl.resource,
        resourceId: accessControl.resourceId,
        ipAddress: null,
        userAgent: null,
        success: true,
        severity: 'medium',
        category: 'authorization',
        metadata: {
          targetUserId: accessControl.userId,
          permissions: accessControl.permissions,
          reason
        }
      });

      return accessControl;
    } catch (error) {
      console.error('Failed to revoke permission:', error);
      throw error;
    }
  }

  // Enable 2FA for user
  static async enable2FA(userId, method = 'totp', phoneNumber = null, email = null) {
    try {
      // Generate secret
      const secret = speakeasy.generateSecret({
        name: `CloudNest (${userId})`,
        issuer: 'CloudNest'
      });

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Create or update 2FA record
      let twoFactorAuth = await TwoFactorAuth.findOne({ userId });
      
      if (twoFactorAuth) {
        twoFactorAuth.secret = secret.base32;
        twoFactorAuth.method = method;
        twoFactorAuth.phoneNumber = phoneNumber;
        twoFactorAuth.email = email;
        twoFactorAuth.backupCodes = backupCodes;
      } else {
        twoFactorAuth = new TwoFactorAuth({
          userId,
          secret: secret.base32,
          method,
          phoneNumber,
          email,
          backupCodes
        });
      }

      await twoFactorAuth.save();

      return {
        secret: secret.base32,
        qrCodeUrl: secret.otpauth_url,
        backupCodes,
        method
      };
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
      throw error;
    }
  }

  // Verify 2FA token
  static async verify2FAToken(userId, token) {
    try {
      const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
      
      if (!twoFactorAuth) {
        throw new Error('2FA not set up for this user');
      }

      // Check if account is locked
      if (twoFactorAuth.lockedUntil && twoFactorAuth.lockedUntil > new Date()) {
        throw new Error('Account temporarily locked due to failed attempts');
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
        return false;
      }

      // Reset failed attempts
      twoFactorAuth.failedAttempts = 0;
      twoFactorAuth.lockedUntil = null;
      twoFactorAuth.lastUsed = new Date();
      await twoFactorAuth.save();

      return true;
    } catch (error) {
      console.error('Failed to verify 2FA token:', error);
      throw error;
    }
  }

  // Disable 2FA for user
  static async disable2FA(userId) {
    try {
      const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
      
      if (twoFactorAuth) {
        twoFactorAuth.isEnabled = false;
        twoFactorAuth.backupCodes = [];
        twoFactorAuth.trustedDevices = [];
        await twoFactorAuth.save();
      }

      // Update user
      await User.findByIdAndUpdate(userId, { twoFactorEnabled: false });

      return true;
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      throw error;
    }
  }

  // Generate backup codes
  static generateBackupCodes() {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Check for suspicious activity
  static async checkSuspiciousActivity(userId, ipAddress, userAgent) {
    try {
      const recentAudits = await SecurityAudit.find({
        userId,
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
        action: { $in: ['login_failed', '2fa_failed', 'suspicious_activity'] }
      });

      // Check for multiple failed login attempts
      const failedLogins = recentAudits.filter(a => a.action === 'login_failed').length;
      if (failedLogins >= 5) {
        await this.recordAuditEvent({
          userId,
          action: 'suspicious_activity',
          resource: 'account',
          ipAddress,
          userAgent,
          success: true,
          severity: 'high',
          category: 'authentication',
          metadata: { reason: 'multiple_failed_logins', count: failedLogins }
        });
        return true;
      }

      // Check for unusual IP address
      const uniqueIPs = new Set(recentAudits.map(a => a.ipAddress));
      if (uniqueIPs.size >= 3) {
        await this.recordAuditEvent({
          userId,
          action: 'suspicious_activity',
          resource: 'account',
          ipAddress,
          userAgent,
          success: true,
          severity: 'medium',
          category: 'authentication',
          metadata: { reason: 'multiple_ip_addresses', count: uniqueIPs.size }
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to check suspicious activity:', error);
      return false;
    }
  }

  // Apply data retention policies
  static async applyRetentionPolicies() {
    try {
      const policies = await DataRetentionPolicy.find({
        isActive: true,
        nextRun: { $lte: new Date() }
      });

      for (const policy of policies) {
        await this.applyPolicy(policy);
        
        // Update next run time
        policy.lastRun = new Date();
        policy.nextRun = this.calculateNextRun(policy.schedule);
        await policy.save();
      }
    } catch (error) {
      console.error('Failed to apply retention policies:', error);
      throw error;
    }
  }

  // Apply individual retention policy
  static async applyPolicy(policy) {
    try {
      const { rules } = policy;
      let totalProcessed = 0;
      let totalDeleted = 0;
      let totalArchived = 0;
      let totalCompressed = 0;

      for (const rule of rules) {
        const { resourceType, conditions, action } = rule;
        
        let resources = [];
        
        // Get resources based on type
        switch (resourceType) {
          case 'file':
            resources = await this.getFilesForRetention(conditions);
            break;
          case 'audit_log':
            resources = await this.getAuditLogsForRetention(conditions);
            break;
          // Add other resource types as needed
        }

        // Apply action to each resource
        for (const resource of resources) {
          const shouldApply = await this.evaluateConditions(resource, conditions);
          
          if (shouldApply) {
            await this.applyRetentionAction(resource, action, policy);
            totalProcessed++;
            
            switch (action) {
              case 'delete':
                totalDeleted++;
                break;
              case 'archive':
                totalArchived++;
                break;
              case 'compress':
                totalCompressed++;
                break;
            }
          }
        }
      }

      // Update statistics
      policy.statistics = {
        totalProcessed: policy.statistics.totalProcessed + totalProcessed,
        totalDeleted: policy.statistics.totalDeleted + totalDeleted,
        totalArchived: policy.statistics.totalArchived + totalArchived,
        totalCompressed: policy.statistics.totalCompressed + totalCompressed,
        lastProcessedAt: new Date()
      };

      await policy.save();
    } catch (error) {
      console.error('Failed to apply policy:', error);
      throw error;
    }
  }

  // Get files for retention based on conditions
  static async getFilesForRetention(conditions) {
    try {
      const query = { isDeleted: false };
      
      if (conditions.age) {
        const cutoffDate = new Date(Date.now() - conditions.age * 24 * 60 * 60 * 1000);
        query.createdAt = { $lt: cutoffDate };
      }
      
      if (conditions.size) {
        query.size = { $gt: conditions.size };
      }
      
      if (conditions.lastAccessed) {
        const cutoffDate = new Date(Date.now() - conditions.lastAccessed * 24 * 60 * 60 * 1000);
        query.lastAccessedAt = { $lt: cutoffDate };
      }

      return await File.find(query);
    } catch (error) {
      console.error('Failed to get files for retention:', error);
      return [];
    }
  }

  // Get audit logs for retention based on conditions
  static async getAuditLogsForRetention(conditions) {
    try {
      const query = {};
      
      if (conditions.age) {
        const cutoffDate = new Date(Date.now() - conditions.age * 24 * 60 * 60 * 1000);
        query.timestamp = { $lt: cutoffDate };
      }
      
      if (conditions.severity) {
        query.severity = { $in: conditions.severity };
      }

      return await SecurityAudit.find(query);
    } catch (error) {
      console.error('Failed to get audit logs for retention:', error);
      return [];
    }
  }

  // Evaluate retention conditions
  static async evaluateConditions(resource, conditions) {
    try {
      // Check age condition
      if (conditions.age) {
        const resourceAge = (Date.now() - resource.createdAt.getTime()) / (24 * 60 * 60 * 1000);
        if (resourceAge < conditions.age) return false;
      }
      
      // Check size condition
      if (conditions.size && resource.size) {
        if (resource.size < conditions.size) return false;
      }
      
      // Check last accessed condition
      if (conditions.lastAccessed && resource.lastAccessedAt) {
        const daysSinceAccess = (Date.now() - resource.lastAccessedAt.getTime()) / (24 * 60 * 60 * 1000);
        if (daysSinceAccess < conditions.lastAccessed) return false;
      }
      
      // Check access frequency condition
      if (conditions.accessFrequency) {
        // This would require tracking access frequency
        // For now, skip this condition
      }
      
      // Check tags condition
      if (conditions.tags && conditions.tags.length > 0) {
        if (!resource.tags || !conditions.tags.some(tag => resource.tags.includes(tag))) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to evaluate conditions:', error);
      return false;
    }
  }

  // Apply retention action to resource
  static async applyRetentionAction(resource, action, policy) {
    try {
      switch (action) {
        case 'delete':
          if (resource.constructor.modelName === 'File') {
            await File.findByIdAndUpdate(resource._id, { isDeleted: true });
          } else if (resource.constructor.modelName === 'SecurityAudit') {
            await SecurityAudit.findByIdAndDelete(resource._id);
          }
          break;
          
        case 'archive':
          // Move to archive storage
          await this.archiveResource(resource, policy.destination);
          break;
          
        case 'compress':
          // Compress the resource
          await this.compressResource(resource);
          break;
          
        case 'move':
          // Move to different location
          await this.moveResource(resource, policy.destination);
          break;
          
        case 'encrypt':
          // Encrypt the resource
          await this.encryptResource(resource);
          break;
          
        case 'notify':
          // Send notification about resource
          await this.notifyRetention(resource, policy);
          break;
      }
    } catch (error) {
      console.error('Failed to apply retention action:', error);
      throw error;
    }
  }

  // Calculate next run time for policy
  static calculateNextRun(schedule) {
    const now = new Date();
    
    switch (schedule) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      case 'quarterly':
        return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
      case 'yearly':
        return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
  }

  // Placeholder methods for retention actions
  static async archiveResource(resource, destination) {
    // Implementation would depend on your archive storage system
    console.log(`Archiving resource ${resource._id} to ${destination}`);
  }

  static async compressResource(resource) {
    // Implementation would depend on your compression system
    console.log(`Compressing resource ${resource._id}`);
  }

  static async moveResource(resource, destination) {
    // Implementation would depend on your file system
    console.log(`Moving resource ${resource._id} to ${destination}`);
  }

  static async encryptResource(resource) {
    // Implementation would depend on your encryption system
    console.log(`Encrypting resource ${resource._id}`);
  }

  static async notifyRetention(resource, policy) {
    // Implementation would depend on your notification system
    console.log(`Notifying about resource ${resource._id} for policy ${policy._id}`);
  }

  // Get security score for user
  static async getSecurityScore(userId) {
    try {
      const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
      const activePermissions = await AccessControl.countDocuments({ 
        userId, 
        isActive: true 
      });
      const retentionPolicies = await DataRetentionPolicy.countDocuments({ 
        userId, 
        isActive: true 
      });
      
      const recentEvents = await SecurityAudit.find({ 
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const criticalEvents = recentEvents.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length;

      let score = 100;

      // 2FA enabled
      if (!twoFactorAuth?.isEnabled) score -= 30;

      // Too many active permissions
      if (activePermissions > 20) score -= 10;
      else if (activePermissions > 10) score -= 5;

      // No retention policies
      if (retentionPolicies === 0) score -= 10;

      // Recent critical events
      if (criticalEvents > 0) score -= criticalEvents * 15;

      return Math.max(0, score);
    } catch (error) {
      console.error('Failed to get security score:', error);
      return 0;
    }
  }

  // Get security recommendations
  static async getSecurityRecommendations(userId) {
    try {
      const securityScore = await this.getSecurityScore(userId);
      const twoFactorAuth = await TwoFactorAuth.findOne({ userId });
      const activePermissions = await AccessControl.countDocuments({ 
        userId, 
        isActive: true 
      });
      
      const recentEvents = await SecurityAudit.find({ 
        userId,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      const criticalEvents = recentEvents.filter(e => 
        e.severity === 'high' || e.severity === 'critical'
      ).length;

      const recommendations = [];

      if (!twoFactorAuth?.isEnabled) {
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
    } catch (error) {
      console.error('Failed to get security recommendations:', error);
      return [];
    }
  }
}

export default SecurityService;
