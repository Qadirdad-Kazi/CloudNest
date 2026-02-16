import 'package:dio/dio.dart';
import '../config/api_config.dart';
import '../models/file_item.dart';

class SearchService {
  final Dio _dio = Dio();

  SearchService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
  }

  // Advanced search with filters
  Future<Map<String, dynamic>> searchFiles({
    required String query,
    List<String> fileTypes = const [],
    List<String> tags = const [],
    Map<String, DateTime>? dateRange,
    Map<String, int>? sizeRange,
    bool? starred,
    String path = '/',
    String sortBy = 'relevance',
    String sortOrder = 'desc',
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.post(
        '/api/search/search',
        data: {
          'query': query,
          'fileTypes': fileTypes,
          'tags': tags,
          'dateRange': dateRange,
          'sizeRange': sizeRange ?? {'min': 0, 'max': 1000000000},
          'starred': starred,
          'path': path,
          'sortBy': sortBy,
          'sortOrder': sortOrder,
          'page': page,
          'limit': limit,
        },
      );

      final data = response.data;
      
      // Convert files to FileItem objects
      final files = (data['files'] as List)
          .map((file) => FileItem.fromJson(file))
          .toList();

      return {
        'files': files,
        'pagination': data['pagination'],
        'filters': data['filters'],
      };
    } catch (e) {
      throw Exception('Search failed: ${e.toString()}');
    }
  }

  // Get search suggestions
  Future<Map<String, dynamic>> getSearchSuggestions(String query, {int limit = 10}) async {
    try {
      final response = await _dio.get(
        '/api/search/suggestions',
        queryParameters: {
          'query': query,
          'limit': limit,
        },
      );

      return response.data;
    } catch (e) {
      throw Exception('Failed to get suggestions: ${e.toString()}');
    }
  }

  // Get popular tags
  Future<List<Map<String, dynamic>>> getPopularTags({int limit = 20}) async {
    try {
      final response = await _dio.get(
        '/api/search/popular-tags',
        queryParameters: {'limit': limit},
      );

      return List<Map<String, dynamic>>.from(response.data['tags']);
    } catch (e) {
      throw Exception('Failed to get popular tags: ${e.toString()}');
    }
  }

  // Search within specific folder
  Future<List<FileItem>> searchInFolder({
    required String folderId,
    required String query,
    bool includeSubfolders = false,
  }) async {
    try {
      final response = await _dio.post(
        '/api/search/folder-search',
        data: {
          'folderId': folderId,
          'query': query,
          'includeSubfolders': includeSubfolders,
        },
      );

      final files = (response.data['files'] as List)
          .map((file) => FileItem.fromJson(file))
          .toList();

      return files;
    } catch (e) {
      throw Exception('Folder search failed: ${e.toString()}');
    }
  }

  // Quick search (simplified)
  Future<List<FileItem>> quickSearch(String query, {int limit = 10}) async {
    try {
      final result = await searchFiles(
        query: query,
        limit: limit,
        sortBy: 'relevance',
      );

      return result['files'] as List<FileItem>;
    } catch (e) {
      throw Exception('Quick search failed: ${e.toString()}');
    }
  }

  // Search by file type
  Future<List<FileItem>> searchByType(String fileType, {int limit = 20}) async {
    try {
      final result = await searchFiles(
        query: '',
        fileTypes: [fileType],
        limit: limit,
        sortBy: 'date',
      );

      return result['files'] as List<FileItem>;
    } catch (e) {
      throw Exception('Type search failed: ${e.toString()}');
    }
  }

  // Search by date range
  Future<List<FileItem>> searchByDateRange({
    required DateTime startDate,
    required DateTime endDate,
    int limit = 20,
  }) async {
    try {
      final result = await searchFiles(
        query: '',
        dateRange: {
          'start': startDate.toIso8601String(),
          'end': endDate.toIso8601String(),
        },
        limit: limit,
        sortBy: 'date',
      );

      return result['files'] as List<FileItem>;
    } catch (e) {
      throw Exception('Date range search failed: ${e.toString()}');
    }
  }

  // Search by size range
  Future<List<FileItem>> searchBySizeRange({
    required int minSize,
    required int maxSize,
    int limit = 20,
  }) async {
    try {
      final result = await searchFiles(
        query: '',
        sizeRange: {'min': minSize, 'max': maxSize},
        limit: limit,
        sortBy: 'size',
      );

      return result['files'] as List<FileItem>;
    } catch (e) {
      throw Exception('Size range search failed: ${e.toString()}');
    }
  }

  // Search starred files
  Future<List<FileItem>> searchStarredFiles({int limit = 20}) async {
    try {
      final result = await searchFiles(
        query: '',
        starred: true,
        limit: limit,
        sortBy: 'date',
      );

      return result['files'] as List<FileItem>;
    } catch (e) {
      throw Exception('Starred search failed: ${e.toString()}');
    }
  }
}
