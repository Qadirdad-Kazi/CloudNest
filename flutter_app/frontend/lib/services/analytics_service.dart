import 'package:dio/dio.dart';
import '../config/api_config.dart';

class AnalyticsService {
  final Dio _dio = Dio();

  AnalyticsService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
  }

  // Get storage analytics
  Future<Map<String, dynamic>> getStorageAnalytics({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/analytics/storage',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get storage analytics: ${e.toString()}');
    }
  }

  // Get activity dashboard
  Future<Map<String, dynamic>> getActivityDashboard({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/analytics/activity',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get activity dashboard: ${e.toString()}');
    }
  }

  // Get file statistics
  Future<Map<String, dynamic>> getFileStatistics({String period = '30d', String sortBy = 'accessed'}) async {
    try {
      final response = await _dio.get(
        '/api/analytics/files',
        queryParameters: {
          'period': period,
          'sortBy': sortBy,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get file statistics: ${e.toString()}');
    }
  }

  // Get performance metrics
  Future<Map<String, dynamic>> getPerformanceMetrics({String period = '24h'}) async {
    try {
      final response = await _dio.get(
        '/api/analytics/performance',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get performance metrics: ${e.toString()}');
    }
  }

  // Get user engagement metrics
  Future<Map<String, dynamic>> getEngagementMetrics({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/analytics/engagement',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get engagement metrics: ${e.toString()}');
    }
  }

  // Record user activity
  Future<void> recordActivity({
    required String fileId,
    required String action,
    Map<String, dynamic>? metadata,
    int? duration,
    bool success = true,
    String? errorMessage,
  }) async {
    try {
      await _dio.post(
        '/api/analytics/record-activity',
        data: {
          'fileId': fileId,
          'action': action,
          'metadata': metadata ?? {},
          'duration': duration,
          'success': success,
          'errorMessage': errorMessage,
        },
      );
    } catch (e) {
      // Silently fail for activity recording
      print('Failed to record activity: $e');
    }
  }

  // Get analytics summary
  Future<Map<String, dynamic>> getAnalyticsSummary({String period = '30d'}) async {
    try {
      final results = await Future.wait([
        getStorageAnalytics(period: period),
        getActivityDashboard(period: period),
        getFileStatistics(period: period),
        getPerformanceMetrics(period: period),
        getEngagementMetrics(period: period),
      ]);

      return {
        'storage': results[0],
        'activity': results[1],
        'files': results[2],
        'performance': results[3],
        'engagement': results[4],
        'period': period,
        'generatedAt': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Failed to get analytics summary: ${e.toString()}');
    }
  }

  // Get storage trends
  Future<List<Map<String, dynamic>>> getStorageTrends({String period = '30d'}) async {
    try {
      final storageData = await getStorageAnalytics(period: period);
      return storageData['growth'] ?? [];
    } catch (e) {
      throw Exception('Failed to get storage trends: ${e.toString()}');
    }
  }

  // Get activity trends
  Future<List<Map<String, dynamic>>> getActivityTrends({String period = '30d'}) async {
    try {
      final activityData = await getActivityDashboard(period: period);
      return activityData['dailyActivity'] ?? [];
    } catch (e) {
      throw Exception('Failed to get activity trends: ${e.toString()}');
    }
  }

  // Get performance trends
  Future<List<Map<String, dynamic>>> getPerformanceTrends({String period = '24h'}) async {
    try {
      final performanceData = await getPerformanceMetrics(period: period);
      return performanceData['performanceData'] ?? [];
    } catch (e) {
      throw Exception('Failed to get performance trends: ${e.toString()}');
    }
  }

  // Get engagement trends
  Future<List<Map<String, dynamic>>> getEngagementTrends({String period = '30d'}) async {
    try {
      final engagementData = await getEngagementMetrics(period: period);
      return engagementData['dailyEngagement'] ?? [];
    } catch (e) {
      throw Exception('Failed to get engagement trends: ${e.toString()}');
    }
  }

  // Get top performing files
  Future<List<Map<String, dynamic>>> getTopPerformingFiles({
    String metric = 'accessed',
    int limit = 10,
    String period = '30d',
  }) async {
    try {
      final fileStats = await getFileStatistics(period: period, sortBy: metric);
      
      switch (metric) {
        case 'accessed':
          return fileStats['mostAccessed']?.take(limit).toList() ?? [];
        case 'shared':
          return fileStats['mostShared']?.take(limit).toList() ?? [];
        case 'downloaded':
          return fileStats['mostDownloaded']?.take(limit).toList() ?? [];
        default:
          return [];
      }
    } catch (e) {
      throw Exception('Failed to get top performing files: ${e.toString()}');
    }
  }

  // Get file type distribution
  Future<Map<String, dynamic>> getFileTypeDistribution({String period = '30d'}) async {
    try {
      final fileStats = await getFileStatistics(period: period);
      return {
        'byType': fileStats['fileTypeDistribution'] ?? [],
        'bySize': fileStats['fileSizeDistribution'] ?? [],
      };
    } catch (e) {
      throw Exception('Failed to get file type distribution: ${e.toString()}');
    }
  }

  // Get user productivity metrics
  Future<Map<String, dynamic>> getProductivityMetrics({String period = '30d'}) async {
    try {
      final activityData = await getActivityDashboard(period: period);
      final engagementData = await getEngagementMetrics(period: period);
      
      return {
        'totalActivities': activityData['summary']['totalActivities'],
        'avgSessionDuration': engagementData['summary']['avgSessionDuration'],
        'activitiesByType': activityData['byType'],
        'peakHours': activityData['peakHours'],
        'productivityScore': _calculateProductivityScore(activityData, engagementData),
      };
    } catch (e) {
      throw Exception('Failed to get productivity metrics: ${e.toString()}');
    }
  }

  // Calculate productivity score
  double _calculateProductivityScore(activityData, engagementData) {
    try {
      final totalActivities = activityData['summary']['totalActivities'] ?? 0;
      final avgSessionDuration = engagementData['summary']['avgSessionDuration'] ?? 0;
      const uniqueActions = (activityData['byType'] as List?)?.length ?? 0;
      
      // Simple productivity score calculation
      double score = 0;
      
      // Activity volume (40% weight)
      score += (totalActivities / 100) * 40;
      
      // Session duration (30% weight)
      score += (avgSessionDuration / 300000) * 30; // 5 minutes max
      
      // Action diversity (30% weight)
      score += (uniqueActions / 10) * 30;
      
      return score.clamp(0, 100);
    } catch (e) {
      return 0;
    }
  }

  // Get storage efficiency metrics
  Future<Map<String, dynamic>> getStorageEfficiency({String period = '30d'}) async {
    try {
      final storageData = await getStorageAnalytics(period: period);
      
      return {
        'totalSize': storageData['summary']['totalSize'],
        'fileCount': storageData['summary']['fileCount'],
        'averageFileSize': storageData['summary']['averageFileSize'],
        'filesByType': storageData['summary']['filesByType'],
        'utilizationRate': _calculateStorageUtilization(storageData),
        'efficiencyScore': _calculateStorageEfficiency(storageData),
      };
    } catch (e) {
      throw Exception('Failed to get storage efficiency: ${e.toString()}');
    }
  }

  // Calculate storage utilization
  double _calculateStorageUtilization(storageData) {
    try {
      const totalSize = storageData['summary']['totalSize'] ?? 0;
      const maxStorage = 5368709120; // 5GB default
      
      return (totalSize / maxStorage) * 100;
    } catch (e) {
      return 0;
    }
  }

  // Calculate storage efficiency
  double _calculateStorageEfficiency(storageData) {
    try {
      const filesByType = storageData['summary']['filesByType'] ?? {};
      const totalSize = storageData['summary']['totalSize'] ?? 0;
      
      // Efficiency based on file type diversity
      const typeCount = filesByType.keys.length;
      const typeEfficiency = (typeCount / 10) * 50; // More types = better organization
      
      // Efficiency based on average file size
      const avgSize = storageData['summary']['averageFileSize'] ?? 0;
      const sizeEfficiency = avgSize > 0 && avgSize < 10485760 ? 50 : 0; // Ideal size range
      
      return typeEfficiency + sizeEfficiency;
    } catch (e) {
      return 0;
    }
  }

  // Get performance insights
  Future<Map<String, dynamic>> getPerformanceInsights({String period = '24h'}) async {
    try {
      final performanceData = await getPerformanceMetrics(period: period);
      
      return {
        'avgResponseTime': performanceData['summary']['metrics']['avgResponseTime'],
        'errorRate': performanceData['summary']['metrics']['errorRate'],
        'throughput': performanceData['summary']['metrics']['throughput'],
        'slowOperations': performanceData['slowOperations'] ?? [],
        'errorPatterns': performanceData['errorPatterns'] ?? [],
        'performanceScore': _calculatePerformanceScore(performanceData),
      };
    } catch (e) {
      throw Exception('Failed to get performance insights: ${e.toString()}');
    }
  }

  // Calculate performance score
  double _calculatePerformanceScore(performanceData) {
    try {
      final avgResponseTime = performanceData['summary']['metrics']['avgResponseTime'] ?? 0;
      final errorRate = performanceData['summary']['metrics']['errorRate'] ?? 0;
      const throughput = performanceData['summary']['metrics']['throughput'] ?? 0;
      
      double score = 100;
      
      // Response time impact (40% weight)
      if (avgResponseTime > 1000) score -= 40;
      else if (avgResponseTime > 500) score -= 20;
      else if (avgResponseTime > 200) score -= 10;
      
      // Error rate impact (40% weight)
      score -= (errorRate * 40);
      
      // Throughput impact (20% weight)
      if (throughput < 10) score -= 20;
      else if (throughput < 50) score -= 10;
      
      return score.clamp(0, 100);
    } catch (e) {
      return 0;
    }
  }

  // Generate comprehensive report
  Future<Map<String, dynamic>> generateReport({
    String period = '30d',
    List<String> sections = const ['storage', 'activity', 'files', 'performance', 'engagement'],
  }) async {
    try {
      final report = {
        'period': period,
        'generatedAt': DateTime.now().toIso8601String(),
        'sections': <String, dynamic>{},
      };

      for (final section in sections) {
        switch (section) {
          case 'storage':
            report['sections'][section] = await getStorageAnalytics(period: period);
            break;
          case 'activity':
            report['sections'][section] = await getActivityDashboard(period: period);
            break;
          case 'files':
            report['sections'][section] = await getFileStatistics(period: period);
            break;
          case 'performance':
            report['sections'][section] = await getPerformanceMetrics(period: period);
            break;
          case 'engagement':
            report['sections'][section] = await getEngagementMetrics(period: period);
            break;
        }
      }

      return report;
    } catch (e) {
      throw Exception('Failed to generate report: ${e.toString()}');
    }
  }
}
