import 'package:dio/dio.dart';
import '../config/api_config.dart';

class CommentService {
  final Dio _dio = Dio();

  CommentService() {
    _dio.options.baseUrl = ApiConfig.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
  }

  // Get all comments for a file
  Future<Map<String, dynamic>> getFileComments(
    String fileId, {
    int page = 1,
    int limit = 20,
    String sortBy = 'createdAt',
    String sortOrder = 'desc',
  }) async {
    try {
      final response = await _dio.get(
        '/api/comments/file/$fileId',
        queryParameters: {
          'page': page,
          'limit': limit,
          'sortBy': sortBy,
          'sortOrder': sortOrder,
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get file comments: ${e.toString()}');
    }
  }

  // Add comment to file
  Future<Map<String, dynamic>> addComment({
    required String fileId,
    required String content,
    List<String> mentions = const [],
    String? parentComment,
  }) async {
    try {
      final response = await _dio.post(
        '/api/comments/file/$fileId',
        data: {
          'content': content.trim(),
          'mentions': mentions,
          'parentComment': parentComment,
        },
      );
      return response.data['comment'];
    } catch (e) {
      throw Exception('Failed to add comment: ${e.toString()}');
    }
  }

  // Update comment
  Future<Map<String, dynamic>> updateComment({
    required String commentId,
    required String content,
    List<String> mentions = const [],
  }) async {
    try {
      final response = await _dio.put(
        '/api/comments/$commentId',
        data: {
          'content': content.trim(),
          'mentions': mentions,
        },
      );
      return response.data['comment'];
    } catch (e) {
      throw Exception('Failed to update comment: ${e.toString()}');
    }
  }

  // Delete comment
  Future<void> deleteComment(String commentId) async {
    try {
      await _dio.delete('/api/comments/$commentId');
    } catch (e) {
      throw Exception('Failed to delete comment: ${e.toString()}');
    }
  }

  // Resolve/unresolve comment
  Future<Map<String, dynamic>> resolveComment({
    required String commentId,
    required bool isResolved,
  }) async {
    try {
      final response = await _dio.patch(
        '/api/comments/$commentId/resolve',
        data: {'isResolved': isResolved},
      );
      return response.data['comment'];
    } catch (e) {
      throw Exception('Failed to resolve comment: ${e.toString()}');
    }
  }

  // Get comments where user is mentioned
  Future<Map<String, dynamic>> getMentions({
    int page = 1,
    int limit = 20,
    bool unread = false,
  }) async {
    try {
      final response = await _dio.get(
        '/api/comments/mentions',
        queryParameters: {
          'page': page,
          'limit': limit,
          'unread': unread.toString(),
        },
      );
      return response.data;
    } catch (e) {
      throw Exception('Failed to get mentions: ${e.toString()}');
    }
  }

  // Mark mentions as read
  Future<void> markMentionsAsRead(List<String> commentIds) async {
    try {
      await _dio.patch(
        '/api/comments/mentions/read',
        data: {'commentIds': commentIds},
      );
    } catch (e) {
      throw Exception('Failed to mark mentions as read: ${e.toString()}');
    }
  }

  // Get comment thread (comment with replies)
  Future<Map<String, dynamic>> getCommentThread(String commentId) async {
    try {
      final response = await _dio.get('/api/comments/thread/$commentId');
      return response.data;
    } catch (e) {
      throw Exception('Failed to get comment thread: ${e.toString()}');
    }
  }

  // Get comment statistics
  Future<Map<String, dynamic>> getCommentStatistics(String fileId) async {
    try {
      final comments = await getFileComments(fileId, limit: 1000);
      final commentList = comments['comments'] as List;
      
      final totalComments = commentList.length;
      final resolvedComments = commentList
          .where((comment) => comment['isResolved'] == true)
          .length;
      
      final totalReplies = commentList.fold<int>(
        0,
        (sum, comment) => sum + (comment['replies']?.length as int? ?? 0),
      );
      
      final uniqueUsers = commentList
          .map((comment) => comment['userId']['_id'])
          .toSet()
          .length;

      return {
        'totalComments': totalComments,
        'resolvedComments': resolvedComments,
        'unresolvedComments': totalComments - resolvedComments,
        'totalReplies': totalReplies,
        'uniqueUsers': uniqueUsers,
        'resolutionRate': totalComments > 0 ? resolvedComments / totalComments : 0.0,
      };
    } catch (e) {
      throw Exception('Failed to get comment statistics: ${e.toString()}');
    }
  }

  // Search comments
  Future<List<Map<String, dynamic>>> searchComments({
    required String fileId,
    required String query,
    bool includeResolved = true,
  }) async {
    try {
      final allComments = await getFileComments(fileId, limit: 1000);
      final commentList = allComments['comments'] as List;
      
      final filteredComments = commentList
          .where((comment) {
            final content = (comment['content'] as String).toLowerCase();
            final matchesQuery = content.contains(query.toLowerCase());
            final isResolved = comment['isResolved'] == true;
            
            return matchesQuery && (includeResolved || !isResolved);
          })
          .toList();

      return filteredComments.cast<Map<String, dynamic>>();
    } catch (e) {
      throw Exception('Failed to search comments: ${e.toString()}');
    }
  }

  // Get recent comments across all files
  Future<List<Map<String, dynamic>>> getRecentComments({int limit = 20}) async {
    try {
      // This would require a new endpoint in the backend
      // For now, we'll return empty list
      return [];
    } catch (e) {
      throw Exception('Failed to get recent comments: ${e.toString()}');
    }
  }

  // Add reaction to comment
  Future<void> addReaction({
    required String commentId,
    required String reaction,
  }) async {
    try {
      await _dio.post(
        '/api/comments/$commentId/reactions',
        data: {'reaction': reaction},
      );
    } catch (e) {
      throw Exception('Failed to add reaction: ${e.toString()}');
    }
  }

  // Remove reaction from comment
  Future<void> removeReaction({
    required String commentId,
    required String reaction,
  }) async {
    try {
      await _dio.delete(
        '/api/comments/$commentId/reactions',
        data: {'reaction': reaction},
      );
    } catch (e) {
      throw Exception('Failed to remove reaction: ${e.toString()}');
    }
  }

  // Get comment activity
  Future<List<Map<String, dynamic>>> getCommentActivity(String fileId) async {
    try {
      final comments = await getFileComments(fileId, limit: 100);
      final commentList = comments['comments'] as List;
      
      final activities = commentList.map((comment) => {
        return {
          'id': comment['_id'],
          'type': comment['parentComment'] != null ? 'reply' : 'comment',
          'user': comment['userId'],
          'content': comment['content'],
          'createdAt': comment['createdAt'],
          'isEdited': comment['isEdited'] ?? false,
          'editedAt': comment['editedAt'],
          'isResolved': comment['isResolved'] ?? false,
        };
      }).toList();

      // Sort by creation date
      activities.sort((a, b) => DateTime.parse(b['createdAt'])
          .compareTo(DateTime.parse(a['createdAt'])));

      return activities;
    } catch (e) {
      throw Exception('Failed to get comment activity: ${e.toString()}');
    }
  }
}
