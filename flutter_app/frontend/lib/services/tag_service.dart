import 'package:dio/dio.dart';
import '../config/api_config.dart';

class TagService {
  final Dio _dio = Dio();

  TagService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
  }

  // Get all tags for a file
  Future<List<Map<String, dynamic>>> getFileTags(String fileId) async {
    try {
      final response = await _dio.get('/api/tags/file/$fileId');
      return List<Map<String, dynamic>>.from(response.data['tags']);
    } catch (e) {
      throw Exception('Failed to get file tags: ${e.toString()}');
    }
  }

  // Get all tags for user
  Future<List<Map<String, dynamic>>> getUserTags() async {
    try {
      final response = await _dio.get('/api/tags/user');
      return List<Map<String, dynamic>>.from(response.data['tags']);
    } catch (e) {
      throw Exception('Failed to get user tags: ${e.toString()}');
    }
  }

  // Add tag to file
  Future<Map<String, dynamic>> addTagToFile({
    required String fileId,
    required String tag,
    String color = '#3B82F6',
  }) async {
    try {
      final response = await _dio.post(
        '/api/tags/file/$fileId',
        data: {
          'tag': tag.trim(),
          'color': color,
        },
      );
      return response.data['tag'];
    } catch (e) {
      throw Exception('Failed to add tag: ${e.toString()}');
    }
  }

  // Remove tag from file
  Future<void> removeTagFromFile(String fileId, String tagId) async {
    try {
      await _dio.delete('/api/tags/file/$fileId/$tagId');
    } catch (e) {
      throw Exception('Failed to remove tag: ${e.toString()}');
    }
  }

  // Update tag
  Future<Map<String, dynamic>> updateTag({
    required String tagId,
    required String tag,
    String? color,
  }) async {
    try {
      final response = await _dio.put(
        '/api/tags/$tagId',
        data: {
          'tag': tag.trim(),
          'color': color,
        },
      );
      return response.data['tag'];
    } catch (e) {
      throw Exception('Failed to update tag: ${e.toString()}');
    }
  }

  // Get files by tag
  Future<Map<String, dynamic>> getFilesByTag(
    String tagName, {
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await _dio.get(
        '/api/tags/tag/$tagName',
        queryParameters: {
          'page': page,
          'limit': limit,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get files by tag: ${e.toString()}');
    }
  }

  // Delete tag completely (from all files)
  Future<void> deleteTag(String tagId) async {
    try {
      await _dio.delete('/api/tags/$tagId');
    } catch (e) {
      throw Exception('Failed to delete tag: ${e.toString()}');
    }
  }

  // Get tag statistics
  Future<Map<String, dynamic>> getTagStatistics() async {
    try {
      final tags = await getUserTags();
      
      final totalTags = tags.length;
      final totalFiles = tags.fold<int>(
        0,
        (sum, tag) => sum + (tag['count'] as int),
      );
      
      final mostUsedTags = tags
          .where((tag) => (tag['count'] as int) > 1)
          .toList()
        ..sort((a, b) => (b['count'] as int).compareTo(a['count'] as int));

      return {
        'totalTags': totalTags,
        'totalFiles': totalFiles,
        'mostUsedTags': mostUsedTags.take(10).toList(),
        'averageFilesPerTag': totalTags > 0 ? totalFiles / totalTags : 0,
      };
    } catch (e) {
      throw Exception('Failed to get tag statistics: ${e.toString()}');
    }
  }

  // Create multiple tags for a file
  Future<List<Map<String, dynamic>>> addMultipleTagsToFile({
    required String fileId,
    required List<Map<String, String>> tags,
  }) async {
    try {
      final results = <Map<String, dynamic>>[];
      
      for (final tagData in tags) {
        final tag = await addTagToFile(
          fileId: fileId,
          tag: tagData['tag']!,
          color: tagData['color'] ?? '#3B82F6',
        );
        results.add(tag);
      }
      
      return results;
    } catch (e) {
      throw Exception('Failed to add multiple tags: ${e.toString()}');
    }
  }

  // Get suggested tags based on file content
  Future<List<String>> getSuggestedTags(String fileId) async {
    try {
      // This would analyze the file and suggest relevant tags
      // For now, return popular tags as suggestions
      final popularTags = await getPopularTags();
      return popularTags
          .take(5)
          .map((tag) => tag['tag'] as String)
          .toList();
    } catch (e) {
      throw Exception('Failed to get suggested tags: ${e.toString()}');
    }
  }

  // Get popular tags (from search service)
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

  // Merge tags (combine multiple tags into one)
  Future<Map<String, dynamic>> mergeTags({
    required List<String> tagIds,
    required String newTagName,
    String? newColor,
  }) async {
    try {
      // This would be a complex operation involving:
      // 1. Finding all files with the old tags
      // 2. Adding the new tag to all those files
      // 3. Removing the old tags from all those files
      // 4. Deleting the old tag definitions
      
      // For now, we'll implement a simplified version
      final response = await _dio.post(
        '/api/tags/merge',
        data: {
          'tagIds': tagIds,
          'newTagName': newTagName.trim(),
          'newColor': newColor ?? '#3B82F6',
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to merge tags: ${e.toString()}');
    }
  }

  // Search tags
  Future<List<Map<String, dynamic>>> searchTags(String query) async {
    try {
      final userTags = await getUserTags();
      return userTags
          .where((tag) => (tag['tag'] as String)
              .toLowerCase()
              .contains(query.toLowerCase()))
          .toList();
    } catch (e) {
      throw Exception('Failed to search tags: ${e.toString()}');
    }
  }
}
