import 'package:dio/dio.dart';
import '../config/api_config.dart';

class SecurityService {
  final Dio _dio = Dio();

  SecurityService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
  }

  // Get security audit logs
  Future<Map<String, dynamic>> getAuditLogs({
    int page = 1,
    int limit = 50,
    String? action,
    String? severity,
    String? category,
    DateTime? startDate,
    DateTime? endDate,
    bool? success,
  }) async {
    try {
      final queryParameters = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (action != null) queryParameters['action'] = action;
      if (severity != null) queryParameters['severity'] = severity;
      if (category != null) queryParameters['category'] = category;
      if (startDate != null) queryParameters['startDate'] = startDate.toIso8601String();
      if (endDate != null) queryParameters['endDate'] = endDate.toIso8601String();
      if (success != null) queryParameters['success'] = success.toString();

      final response = await _dio.get(
        '/api/security/audit',
        queryParameters: queryParameters,
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get audit logs: ${e.toString()}');
    }
  }

  // Get 2FA status
  Future<Map<String, dynamic>> getTwoFactorAuthStatus() async {
    try {
      final response = await _dio.get('/api/security/2fa/status');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get 2FA status: ${e.toString()}');
    }
  }

  // Enable 2FA
  Future<Map<String, dynamic>> enableTwoFactorAuth({
    String method = 'totp',
    String? phoneNumber,
    String? email,
  }) async {
    try {
      final response = await _dio.post(
        '/api/security/2fa/enable',
        data: {
          'method': method,
          'phoneNumber': phoneNumber,
          'email': email,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to enable 2FA: ${e.toString()}');
    }
  }

  // Verify and enable 2FA
  Future<void> verifyAndEnableTwoFactorAuth(String token) async {
    try {
      await _dio.post(
        '/api/security/2fa/verify',
        data: {'token': token},
      );
    } catch (e) {
      throw Exception('Failed to verify 2FA: ${e.toString()}');
    }
  }

  // Disable 2FA
  Future<void> disableTwoFactorAuth({
    required String password,
    String? token,
  }) async {
    try {
      await _dio.post(
        '/api/security/2fa/disable',
        data: {
          'password': password,
          'token': token,
        },
      );
    } catch (e) {
      throw Exception('Failed to disable 2FA: ${e.toString()}');
    }
  }

  // Get access control permissions
  Future<List<Map<String, dynamic>>> getAccessControlPermissions({
    String? resource,
    String? resourceId,
  }) async {
    try {
      final queryParameters = <String, dynamic>{};
      if (resource != null) queryParameters['resource'] = resource;
      if (resourceId != null) queryParameters['resourceId'] = resourceId;

      final response = await _dio.get(
        '/api/security/access-control',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['permissions']);
    } catch (e) {
      throw Exception('Failed to get access control: ${e.toString()}');
    }
  }

  // Grant access control
  Future<Map<String, dynamic>> grantAccessControl({
    required String targetUserId,
    required String resource,
    required String resourceId,
    required List<String> permissions,
    DateTime? expiresAt,
    Map<String, dynamic>? conditions,
  }) async {
    try {
      final response = await _dio.post(
        '/api/security/access-control/grant',
        data: {
          'targetUserId': targetUserId,
          'resource': resource,
          'resourceId': resourceId,
          'permissions': permissions,
          'expiresAt': expiresAt?.toIso8601String(),
          'conditions': conditions ?? {},
        },
      );
      return response.data['accessControl'];
    } catch (e) {
      throw Exception('Failed to grant access: ${e.toString()}');
    }
  }

  // Revoke access control
  Future<void> revokeAccessControl({
    required String accessControlId,
    String? reason,
  }) async {
    try {
      await _dio.post(
        '/api/security/access-control/revoke/$accessControlId',
        data: {'reason': reason},
      );
    } catch (e) {
      throw Exception('Failed to revoke access: ${e.toString()}');
    }
  }

  // Get data retention policies
  Future<List<Map<String, dynamic>>> getDataRetentionPolicies({
    String? policyType,
  }) async {
    try {
      final queryParameters = <String, dynamic>{};
      if (policyType != null) queryParameters['policyType'] = policyType;

      final response = await _dio.get(
        '/api/security/retention-policies',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['policies']);
    } catch (e) {
      throw Exception('Failed to get retention policies: ${e.toString()}');
    }
  }

  // Create data retention policy
  Future<Map<String, dynamic>> createDataRetentionPolicy({
    required String policyType,
    required String name,
    String? description,
    required List<Map<String, dynamic>> rules,
    String? schedule,
  }) async {
    try {
      final response = await _dio.post(
        '/api/security/retention-policies',
        data: {
          'policyType': policyType,
          'name': name,
          'description': description,
          'rules': rules,
          'schedule': schedule ?? 'monthly',
        },
      );
      return response.data['policy'];
    } catch (e) {
      throw Exception('Failed to create retention policy: ${e.toString()}');
    }
  }

  // Get security summary
  Future<Map<String, dynamic>> getSecuritySummary() async {
    try {
      final response = await _dio.get('/api/security/summary');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get security summary: ${e.toString()}');
    }
  }

  // Get security score
  Future<int> getSecurityScore() async {
    try {
      final summary = await getSecuritySummary();
      return summary['summary']['securityScore'] ?? 0;
    } catch (e) {
      throw Exception('Failed to get security score: ${e.toString()}');
    }
  }

  // Get security recommendations
  Future<List<Map<String, dynamic>>> getSecurityRecommendations() async {
    try {
      final summary = await getSecuritySummary();
      return List<Map<String, dynamic>>.from(summary['recommendations']);
    } catch (e) {
      throw Exception('Failed to get security recommendations: ${e.toString()}');
    }
  }

  // Check if user has specific permission
  Future<bool> hasPermission({
    required String resource,
    required String resourceId,
    required String permission,
  }) async {
    try {
      final permissions = await getAccessControlPermissions(
        resource: resource,
        resourceId: resourceId,
      );
      
      return permissions.any((perm) => 
        perm['permissions'].contains(permission) &&
        perm['isActive'] == true
      );
    } catch (e) {
      return false;
    }
  }

  // Get recent security events
  Future<List<Map<String, dynamic>>> getRecentSecurityEvents({
    int limit = 10,
    String? severity,
  }) async {
    try {
      final auditLogs = await getAuditLogs(
        limit: limit,
        severity: severity,
      );
      return List<Map<String, dynamic>>.from(auditLogs['audits']);
    } catch (e) {
      throw Exception('Failed to get recent security events: ${e.toString()}');
    }
  }

  // Get security metrics
  Future<Map<String, dynamic>> getSecurityMetrics({String period = '30d'}) async {
    try {
      final endDate = DateTime.now();
      final startDate = endDate.subtract(Duration(days: _getDaysFromPeriod(period)));

      final auditLogs = await getAuditLogs(
        startDate: startDate,
        endDate: endDate,
        limit: 1000,
      );

      final logs = List<Map<String, dynamic>>.from(auditLogs['audits']);
      
      // Calculate metrics
      final totalEvents = logs.length;
      final successfulEvents = logs.where((log) => log['success'] == true).length;
      final failedEvents = logs.where((log) => log['success'] == false).length;
      
      final eventsBySeverity = <String, int>{};
      for (final log in logs) {
        final severity = log['severity'] as String;
        eventsBySeverity[severity] = (eventsBySeverity[severity] ?? 0) + 1;
      }

      final eventsByCategory = <String, int>{};
      for (final log in logs) {
        final category = log['category'] as String;
        eventsByCategory[category] = (eventsByCategory[category] ?? 0) + 1;
      }

      final criticalEvents = logs.where((log) => 
        log['severity'] == 'high' || log['severity'] == 'critical'
      ).length;

      return {
        'period': period,
        'totalEvents': totalEvents,
        'successfulEvents': successfulEvents,
        'failedEvents': failedEvents,
        'successRate': totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0,
        'eventsBySeverity': eventsBySeverity,
        'eventsByCategory': eventsByCategory,
        'criticalEvents': criticalEvents,
        'mostRecentEvent': logs.isNotEmpty ? logs.first : null,
      };
    } catch (e) {
      throw Exception('Failed to get security metrics: ${e.toString()}');
    }
  }

  // Get permission statistics
  Future<Map<String, dynamic>> getPermissionStatistics() async {
    try {
      final permissions = await getAccessControlPermissions();
      
      final activePermissions = permissions.where((perm) => perm['isActive'] == true);
      final expiredPermissions = permissions.where((perm) => 
        perm['isActive'] == false && perm['revokedAt'] != null
      );
      
      final permissionsByResource = <String, int>{};
      final permissionsByType = <String, int>{};
      
      for (final perm in activePermissions) {
        final resource = perm['resource'] as String;
        permissionsByResource[resource] = (permissionsByResource[resource] ?? 0) + 1;
        
        for (final permission in perm['permissions']) {
          permissionsByType[permission] = (permissionsByType[permission] ?? 0) + 1;
        }
      }

      return {
        'totalPermissions': permissions.length,
        'activePermissions': activePermissions.length,
        'expiredPermissions': expiredPermissions.length,
        'permissionsByResource': permissionsByResource,
        'permissionsByType': permissionsByType,
        'recentlyGranted': activePermissions.where((perm) => 
          DateTime.parse(perm['grantedAt']).isAfter(DateTime.now().subtract(const Duration(days: 7)))
        ).length,
      };
    } catch (e) {
      throw Exception('Failed to get permission statistics: ${e.toString()}');
    }
  }

  // Get 2FA statistics
  Future<Map<String, dynamic>> getTwoFactorAuthStatistics() async {
    try {
      final status = await getTwoFactorAuthStatus();
      
      return {
        'enabled': status['enabled'] ?? false,
        'method': status['method'],
        'hasBackupCodes': status['hasBackupCodes'] ?? false,
        'trustedDevices': status['trustedDevices']?.length ?? 0,
        'lastUsed': status['lastUsed'],
      };
    } catch (e) {
      throw Exception('Failed to get 2FA statistics: ${e.toString()}');
    }
  }

  // Get retention policy statistics
  Future<Map<String, dynamic>> getRetentionPolicyStatistics() async {
    try {
      final policies = await getDataRetentionPolicies();
      
      final activePolicies = policies.where((policy) => policy['isActive'] == true);
      final policiesByType = <String, int>{};
      
      for (final policy in activePolicies) {
        final type = policy['policyType'] as String;
        policiesByType[type] = (policiesByType[type] ?? 0) + 1;
      }

      return {
        'totalPolicies': policies.length,
        'activePolicies': activePolicies.length,
        'policiesByType': policiesByType,
        'policiesNeedingAttention': activePolicies.where((policy) => 
          policy['lastRun'] == null || 
          DateTime.parse(policy['lastRun']).isBefore(DateTime.now().subtract(const Duration(days: 30)))
        ).length,
      };
    } catch (e) {
      throw Exception('Failed to get retention policy statistics: ${e.toString()}');
    }
  }

  // Get comprehensive security dashboard
  Future<Map<String, dynamic>> getSecurityDashboard({String period = '30d'}) async {
    try {
      final results = await Future.wait([
        getSecuritySummary(),
        getSecurityMetrics(period: period),
        getPermissionStatistics(),
        getTwoFactorAuthStatistics(),
        getRetentionPolicyStatistics(),
        getRecentSecurityEvents(limit: 5),
      ]);

      return {
        'summary': results[0],
        'metrics': results[1],
        'permissions': results[2],
        'twoFactorAuth': results[3],
        'retentionPolicies': results[4],
        'recentEvents': results[5],
        'period': period,
        'generatedAt': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Failed to get security dashboard: ${e.toString()}');
    }
  }

  // Helper method to convert period string to days
  int _getDaysFromPeriod(String period) {
    switch (period.toLowerCase()) {
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
        return 90;
      case '1y':
        return 365;
      default:
        return 30;
    }
  }

  // Validate security settings
  Future<Map<String, dynamic>> validateSecuritySettings() async {
    try {
      final issues = <Map<String, dynamic>>[];
      
      // Check 2FA
      final twoFactorStatus = await getTwoFactorAuthStatus();
      if (!twoFactorStatus['enabled']) {
        issues.add({
          'type': '2fa',
          'severity': 'high',
          'message': 'Two-factor authentication is not enabled',
          'recommendation': 'Enable 2FA to add an extra layer of security'
        });
      }

      // Check security score
      final securityScore = await getSecurityScore();
      if (securityScore < 70) {
        issues.add({
          'type': 'score',
          'severity': 'medium',
          'message': 'Security score is below 70',
          'recommendation': 'Review and improve security settings'
        });
      }

      // Check recent critical events
      final recentEvents = await getRecentSecurityEvents(severity: 'high');
      if (recentEvents.isNotEmpty) {
        issues.add({
          'type': 'events',
          'severity': 'high',
          'message': 'Recent critical security events detected',
          'recommendation': 'Review security audit logs for suspicious activity'
        });
      }

      return {
        'isValid': issues.isEmpty,
        'issues': issues,
        'score': securityScore,
        'recommendations': await getSecurityRecommendations(),
      };
    } catch (e) {
      throw Exception('Failed to validate security settings: ${e.toString()}');
    }
  }
}
