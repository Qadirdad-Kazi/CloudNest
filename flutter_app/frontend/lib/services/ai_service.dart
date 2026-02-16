import 'package:dio/dio.dart';
import '../config/api_config.dart';

class AIService {
  final Dio _dio = Dio();

  AIService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
  }

  // Smart File Organization
  Future<Map<String, dynamic>> organizeFiles({bool force = false}) async {
    try {
      final response = await _dio.post(
        '/api/ai/organize-files',
        data: {'force': force},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to organize files: ${e.toString()}');
    }
  }

  // Get file categories
  Future<List<Map<String, dynamic>>> getFileCategories({String? fileId}) async {
    try {
      final queryParameters = <String, dynamic>{};
      if (fileId != null) queryParameters['fileId'] = fileId;

      final response = await _dio.get(
        '/api/ai/categories',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['categories']);
    } catch (e) {
      throw Exception('Failed to get file categories: ${e.toString()}');
    }
  }

  // Update file category manually
  Future<Map<String, dynamic>> updateFileCategory({
    required String fileId,
    required String category,
    String? subcategory,
    List<String>? tags,
  }) async {
    try {
      final response = await _dio.put(
        '/api/ai/categories/$fileId',
        data: {
          'category': category,
          'subcategory': subcategory,
          'tags': tags ?? [],
        },
      );
      return response.data['category'];
    } catch (e) {
      throw Exception('Failed to update file category: ${e.toString()}');
    }
  }

  // Image Recognition
  Future<Map<String, dynamic>> analyzeImage(String fileId) async {
    try {
      final response = await _dio.post(
        '/api/ai/analyze-image/$fileId',
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to analyze image: ${e.toString()}');
    }
  }

  // Get image metadata
  Future<Map<String, dynamic>> getImageMetadata(String fileId) async {
    try {
      final response = await _dio.get(
        '/api/ai/image-metadata/$fileId',
      );
      return response.data['metadata'];
    } catch (e) {
      throw Exception('Failed to get image metadata: ${e.toString()}');
    }
  }

  // Search images by tags
  Future<List<Map<String, dynamic>>> searchImages({
    List<String>? tags,
    List<String>? objects,
    bool? faces,
    double minConfidence = 0.5,
  }) async {
    try {
      final queryParameters = <String, dynamic>{
        'minConfidence': minConfidence,
      };
      
      if (tags != null) queryParameters['tags'] = tags.join(',');
      if (objects != null) queryParameters['objects'] = objects.join(',');
      if (faces != null) queryParameters['faces'] = faces.toString();

      final response = await _dio.get(
        '/api/ai/images/search',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['images']);
    } catch (e) {
      throw Exception('Failed to search images: ${e.toString()}');
    }
  }

  // Duplicate Detection
  Future<Map<String, dynamic>> detectDuplicates({
    String algorithm = 'hybrid',
    double threshold = 0.9,
  }) async {
    try {
      final response = await _dio.post(
        '/api/ai/detect-duplicates',
        data: {
          'algorithm': algorithm,
          'threshold': threshold,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to detect duplicates: ${e.toString()}');
    }
  }

  // Get duplicates
  Future<List<Map<String, dynamic>>> getDuplicates({
    String? status,
    String? algorithm,
  }) async {
    try {
      final queryParameters = <String, dynamic>{};
      if (status != null) queryParameters['status'] = status;
      if (algorithm != null) queryParameters['algorithm'] = algorithm;

      final response = await _dio.get(
        '/api/ai/duplicates',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['duplicates']);
    } catch (e) {
      throw Exception('Failed to get duplicates: ${e.toString()}');
    }
  }

  // Resolve duplicate
  Future<Map<String, dynamic>> resolveDuplicate({
    required String duplicateId,
    required String action,
    String? notes,
  }) async {
    try {
      final response = await _dio.put(
        '/api/ai/duplicates/$duplicateId/resolve',
        data: {
          'action': action,
          'notes': notes,
        },
      );
      return response.data['duplicate'];
    } catch (e) {
      throw Exception('Failed to resolve duplicate: ${e.toString()}');
    }
  }

  // Content Search
  Future<Map<String, dynamic>> indexContent(String fileId) async {
    try {
      final response = await _dio.post(
        '/api/ai/index-content/$fileId',
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to index content: ${e.toString()}');
    }
  }

  // Search content
  Future<List<Map<String, dynamic>>> searchContent({
    required String query,
    String? fileType,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.post(
        '/api/ai/search-content',
        data: {
          'query': query,
          'fileType': fileType,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(response.data['results']);
    } catch (e) {
      throw Exception('Failed to search content: ${e.toString()}');
    }
  }

  // Get smart suggestions
  Future<List<Map<String, dynamic>>> getSmartSuggestions({
    String? type,
    String? fileId,
    int limit = 10,
  }) async {
    try {
      final queryParameters = <String, dynamic>{
        'limit': limit,
      };
      
      if (type != null) queryParameters['type'] = type;
      if (fileId != null) queryParameters['fileId'] = fileId;

      final response = await _dio.get(
        '/api/ai/suggestions',
        queryParameters: queryParameters,
      );
      return List<Map<String, dynamic>>.from(response.data['suggestions']);
    } catch (e) {
      throw Exception('Failed to get suggestions: ${e.toString()}');
    }
  }

  // Generate smart suggestions
  Future<Map<String, dynamic>> generateSmartSuggestions({
    required String type,
    String? fileId,
  }) async {
    try {
      final response = await _dio.post(
        '/api/ai/generate-suggestions',
        data: {
          'type': type,
          'fileId': fileId,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to generate suggestions: ${e.toString()}');
    }
  }

  // Provide feedback on suggestion
  Future<Map<String, dynamic>> provideSuggestionFeedback({
    required String suggestionId,
    required String action,
    int? feedback,
  }) async {
    try {
      final response = await _dio.put(
        '/api/ai/suggestions/$suggestionId/feedback',
        data: {
          'action': action,
          'feedback': feedback,
        },
      );
      return response.data['suggestion'];
    } catch (e) {
      throw Exception('Failed to provide feedback: ${e.toString()}');
    }
  }

  // Get AI model status
  Future<Map<String, dynamic>> getAIModelStatus() async {
    try {
      final response = await _dio.get('/api/ai/models/status');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get AI model status: ${e.toString()}');
    }
  }

  // Train AI model
  Future<Map<String, dynamic>> trainAIModel({
    required String modelType,
    Map<String, dynamic>? trainingData,
  }) async {
    try {
      final response = await _dio.post(
        '/api/ai/models/train',
        data: {
          'modelType': modelType,
          'trainingData': trainingData ?? {},
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to train AI model: ${e.toString()}');
    }
  }

  // Get AI analytics
  Future<Map<String, dynamic>> getAIAnalytics({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/ai/analytics',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get AI analytics: ${e.toString()}');
    }
  }

  // Get AI-powered insights
  Future<Map<String, dynamic>> getAIInsights() async {
    try {
      final response = await _dio.get('/api/ai/insights');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get AI insights: ${e.toString()}');
    }
  }

  // Batch organize files
  Future<Map<String, dynamic>> batchOrganizeFiles(List<String> fileIds) async {
    try {
      final results = <Map<String, dynamic>>{};
      
      for (final fileId in fileIds) {
        try {
          final result = await organizeFiles(force: true);
          results[fileId] = result;
        } catch (e) {
          results[fileId] = {'error': e.toString()};
        }
      }
      
      return {
        'total': fileIds.length,
        'success': results.values.where((r) => !r.containsKey('error')).length,
        'failed': results.values.where((r) => r.containsKey('error')).length,
        'results': results
      };
    } catch (e) {
      throw Exception('Failed to batch organize files: ${e.toString()}');
    }
  }

  // Get AI-powered file recommendations
  Future<List<Map<String, dynamic>>> getFileRecommendations({
    String? context,
    int limit = 10,
  }) async {
    try {
      final response = await _dio.post(
        '/api/ai/recommendations',
        data: {
          'context': context,
          'limit': limit,
        },
      );
      return List<Map<String, dynamic>>.from(response.data['recommendations']);
    } catch (e) {
      throw Exception('Failed to get file recommendations: ${e.toString()}');
    }
  }

  // Get AI-powered search suggestions
  Future<List<String>> getSearchSuggestions(String query) async {
    try {
      final response = await _dio.get(
        '/api/ai/search-suggestions',
        queryParameters: {'query': query},
      );
      return List<String>.from(response.data['suggestions']);
    } catch (e) {
      throw Exception('Failed to get search suggestions: ${e.toString()}');
    }
  }

  // Get AI-powered file insights
  Future<Map<String, dynamic>> getFileInsights(String fileId) async {
    try {
      final response = await _dio.get(
        '/api/ai/file-insights/$fileId',
      );
      return response.data['insights'];
    } catch (e) {
      throw Exception('Failed to get file insights: ${e.toString()}');
    }
  }

  // Get AI-powered storage optimization suggestions
  Future<List<Map<String, dynamic>>> getStorageOptimizationSuggestions() async {
    try {
      final response = await _dio.get('/api/ai/storage-optimization');
      return List<Map<String, dynamic>>.from(response.data['suggestions']);
    } catch (e) {
      throw Exception('Failed to get storage optimization suggestions: ${e.toString()}');
    }
  }

  // Get AI-powered productivity insights
  Future<Map<String, dynamic>> getProductivityInsights({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/ai/productivity-insights',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get productivity insights: ${e.toString()}');
    }
  }

  // Get AI-powered usage patterns
  Future<Map<String, dynamic>> getUsagePatterns({String period = '30d'}) async {
    try {
      final response = await _dio.get(
        '/api/ai/usage-patterns',
        queryParameters: {'period': period},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get usage patterns: ${e.toString()}');
    }
  }

  // Get AI-powered predictions
  Future<Map<String, dynamic>> getPredictions() async {
    try {
      final response = await _dio.get('/api/ai/predictions');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get predictions: ${e.toString()}');
    }
  }

  // Get AI-powered anomaly detection
  Future<List<Map<String, dynamic>>> detectAnomalies() async {
    try {
      final response = await _dio.get('/api/ai/anomalies');
      return List<Map<String, dynamic>>.from(response.data['anomalies']);
    } catch (e) {
      throw Exception('Failed to detect anomalies: ${e.toString()}');
    }
  }

  // Get AI-powered recommendations
  Future<Map<String, dynamic>> getRecommendations() async {
    try {
      final response = await _dio.get('/api/ai/recommendations');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get recommendations: ${e.toString()}');
    }
  }

  // Get AI-powered dashboard
  Future<Map<String, dynamic>> getAIDashboard({String period = '30d'}) async {
    try {
      final results = await Future.wait([
        getAIAnalytics(period: period),
        getAIInsights(),
        getFileRecommendations(limit: 5),
        getStorageOptimizationSuggestions(),
        getProductivityInsights(period: period),
        getUsagePatterns(period: period),
      ]);

      return {
        'analytics': results[0],
        'insights': results[1],
        'recommendations': results[2],
        'storageOptimization': results[3],
        'productivity': results[4],
        'usagePatterns': results[5],
        'period': period,
        'generatedAt': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Failed to get AI dashboard: ${e.toString()}');
    }
  }

  // Get AI-powered file statistics
  Future<Map<String, dynamic>> getAIFileStatistics() async {
    try {
      final results = await Future.wait([
        getFileCategories(),
        getDuplicates(),
        getSmartSuggestions(),
      ]);

      final categories = results[0];
      final duplicates = results[1];
      final suggestions = results[2];

      return {
        'totalFiles': categories.length,
        'categorizedFiles': categories.where((c) => c['autoCategorized']).length,
        'duplicateFiles': duplicates.length,
        'pendingDuplicates': duplicates.where((d) => d['status'] == 'pending').length,
        'activeSuggestions': suggestions.where((s) => s['isActive']).length,
        'categories': categories,
        'duplicates': duplicates,
        'suggestions': suggestions,
      };
    } catch (e) {
      throw Exception('Failed to get AI file statistics: ${e.toString()}');
    }
  }

  // Get AI-powered image statistics
  Future<Map<String, dynamic>> getAIImageStatistics() async {
    try {
      final images = await searchImages();
      
      final totalImages = images.length;
      final analyzedImages = images.where((img) => img['processedAt'] != null).length;
      
      final dominantColors = <String, int>{};
      final detectedObjects = <String, int>{};
      final detectedFaces = images.fold<int>(0, (sum, img) => sum + (img['faces']?.length ?? 0));
      
      for (final image in images) {
        if (image['dominantColors'] != null) {
          for (final color in image['dominantColors']) {
            dominantColors[color['color']] = (dominantColors[color['color']] ?? 0) + 1;
          }
        }
        
        if (image['objects'] != null) {
          for (final object in image['objects']) {
            detectedObjects[object['label']] = (detectedObjects[object['label']] ?? 0) + 1;
          }
        }
      }

      return {
        'totalImages': totalImages,
        'analyzedImages': analyzedImages,
        'detectedFaces': detectedFaces,
        'dominantColors': dominantColors,
        'detectedObjects': detectedObjects,
        'images': images,
      };
    } catch (e) {
      throw Exception('Failed to get AI image statistics: ${e.toString()}');
    }
  }

  // Get AI-powered content statistics
  Future<Map<String, dynamic>> getAIContentStatistics() async {
    try {
      // This would require a new endpoint in the backend
      // For now, return mock data
      return {
        'indexedFiles': 0,
        'totalWords': 0,
        'averageWordCount': 0,
        'supportedLanguages': ['en'],
        'mostCommonKeywords': [],
        'contentTypes': [],
      };
    } catch (e) {
      throw Exception('Failed to get AI content statistics: ${e.toString()}');
    }
  }

  // Get AI-powered suggestion statistics
  Future<Map<String, dynamic>> getAISuggestionStatistics() async {
    try {
      final suggestions = await getSmartSuggestions();
      
      final totalSuggestions = suggestions.length;
      final activeSuggestions = suggestions.where((s) => s['isActive']).length;
      
      final suggestionTypes = <String, int>{};
      for (final suggestion in suggestions) {
        suggestionTypes[suggestion['suggestionType']] = (suggestionTypes[suggestion['suggestionType']] ?? 0) + 1;
      }

      return {
        'totalSuggestions': totalSuggestions,
        'activeSuggestions': activeSuggestions,
        'suggestionTypes': suggestionTypes,
        'averageScore': suggestions.isEmpty ? 0 : 
          suggestions.fold<double>(0, (sum, s) => sum + s['score']) / suggestions.length,
        'suggestions': suggestions,
      };
    } catch (e) {
      throw Exception('Failed to get AI suggestion statistics: ${e.toString()}');
    }
  }

  // Get AI-powered overall statistics
  Future<Map<String, dynamic>> getAIOverallStatistics() async {
    try {
      final results = await Future.wait([
        getAIFileStatistics(),
        getAIImageStatistics(),
        getAIContentStatistics(),
        getAISuggestionStatistics(),
      ]);

      return {
        'files': results[0],
        'images': results[1],
        'content': results[2],
        'suggestions': results[3],
        'generatedAt': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Failed to get AI overall statistics: ${e.toString()}');
    }
  }

  // Get AI-powered health check
  Future<Map<String, dynamic>> getAIHealthCheck() async {
    try {
      final results = await Future.wait([
        getAIModelStatus(),
        getAIAnalytics(),
      ]);

      return {
        'modelStatus': results[0],
        'analytics': results[1],
        'healthy': true,
        'lastChecked': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Failed to get AI health check: ${e.toString()}');
    }
  }

  // Get AI-powered configuration
  Future<Map<String, dynamic>> getAIConfiguration() async {
    try {
      final response = await _dio.get('/api/ai/configuration');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get AI configuration: ${e.toString()}');
    }
  }

  // Update AI configuration
  Future<Map<String, dynamic>> updateAIConfiguration({
    Map<String, dynamic>? config,
  }) async {
    try {
      final response = await _dio.put(
        '/api/ai/configuration',
        data: config ?? {},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to update AI configuration: ${e.toString()}');
    }
  }

  // Get AI-powered settings
  Future<Map<String, dynamic>> getAISettings() async {
    try {
      final response = await _dio.get('/api/ai/settings');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get AI settings: ${e.toString()}');
    }
  }

  // Update AI settings
  Future<Map<String, dynamic>> updateAISettings({
    Map<String, dynamic>? settings,
  }) async {
    try {
      final response = await _dio.put(
        '/api/ai/settings',
        data: settings ?? {},
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to update AI settings: ${e.toString()}');
    }
  }
}
