import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'file_service.dart';

/// Home Screen Widget Service for quick access to recent files
class WidgetService {
  static const String _recentFilesKey = 'widget_recent_files';
  static const String _storageInfoKey = 'widget_storage_info';
  static const String _lastUpdateKey = 'widget_last_update';
  
  static final WidgetService _instance = WidgetService._internal();
  factory WidgetService() => _instance;
  
  WidgetService._internal();

  // Update widget data
  Future<void> updateWidgetData() async {
    try {
      if (kIsWeb) return;
      
      // Get recent files
      final apiService = ApiService();
      final fileService = FileService();
      
      try {
        // For now, return empty recent files since getRecentFiles doesn't exist
        final recentFiles = <Map<String, dynamic>>[];
        final storageInfo = await _getStorageInfo();
        
        // Save to preferences for widget access
        final prefs = await SharedPreferences.getInstance();
        
        // Save recent files as JSON
        final recentFilesJson = recentFiles.map((file) {
          if (file is Map<String, dynamic>) {
            return {
              'id': file['id'] ?? '',
              'name': file['name'] ?? '',
              'type': file['type'] ?? '',
              'size': file['size'] ?? 0,
              'path': file['path'] ?? '',
              'url': file['url'] ?? '',
              'starred': file['starred'] ?? false,
              'modifiedAt': file['modifiedAt']?.toString() ?? '',
            };
          }
          return {};
        }).where((map) => map['id']?.isNotEmpty).toList();
        
        await prefs.setString(_recentFilesKey, recentFilesJson.toString());
        await prefs.setString(_storageInfoKey, storageInfo.toString());
        await prefs.setString(_lastUpdateKey, DateTime.now().toIso8601String());
        
        debugPrint('Widget data updated successfully');
      } catch (e) {
        debugPrint('Failed to fetch data for widget: $e');
        // Use cached data if network fails
        await _updateWithCachedData();
      }
    } catch (e) {
      debugPrint('Widget update failed: $e');
    }
  }

  // Get widget data for home screen widget
  Future<Map<String, dynamic>> getWidgetData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      final recentFilesJson = prefs.getString(_recentFilesKey);
      final storageInfoJson = prefs.getString(_storageInfoKey);
      final lastUpdate = prefs.getString(_lastUpdateKey);
      
      return {
        'recentFiles': recentFilesJson ?? '[]',
        'storageInfo': storageInfoJson ?? '{}',
        'lastUpdate': lastUpdate ?? DateTime.now().toIso8601String(),
        'isConnected': await _isConnected(),
      };
    } catch (e) {
      debugPrint('Failed to get widget data: $e');
      return {
        'recentFiles': '[]',
        'storageInfo': '{}',
        'lastUpdate': DateTime.now().toIso8601String(),
        'isConnected': false,
      };
    }
  }

  // Get storage information
  Future<Map<String, dynamic>> _getStorageInfo() async {
    try {
      final apiService = ApiService();
      
      // Try to get user storage info
      final response = await apiService.get('/users/storage');
      final data = response.data as Map<String, dynamic>;
      
      return {
        'totalSpace': data['totalSpace'] ?? 0,
        'usedSpace': data['usedSpace'] ?? 0,
        'availableSpace': data['availableSpace'] ?? 0,
        'usagePercentage': data['usagePercentage'] ?? 0,
        'fileCount': data['fileCount'] ?? 0,
        'folderCount': data['folderCount'] ?? 0,
      };
    } catch (e) {
      debugPrint('Failed to get storage info: $e');
      // Return default values
      return {
        'totalSpace': 5368709120, // 5GB in bytes
        'usedSpace': 1073741824,  // 1GB in bytes
        'availableSpace': 4294967296, // 4GB in bytes
        'usagePercentage': 20.0,
        'fileCount': 0,
        'folderCount': 0,
      };
    }
  }

  // Update with cached data when offline
  Future<void> _updateWithCachedData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastUpdate = prefs.getString(_lastUpdateKey);
      
      if (lastUpdate != null) {
        final lastUpdateTime = DateTime.parse(lastUpdate);
        final now = DateTime.now();
        
        // Use cached data if less than 1 hour old
        if (now.difference(lastUpdateTime).inHours < 1) {
          debugPrint('Using cached widget data');
          return;
        }
      }
      
      // Update with default data if cache is too old
      await prefs.setString(_recentFilesKey, '[]');
      await prefs.setString(_storageInfoKey, '{}');
      await prefs.setString(_lastUpdateKey, DateTime.now().toIso8601String());
    } catch (e) {
      debugPrint('Failed to update with cached data: $e');
    }
  }

  // Check network connectivity
  Future<bool> _isConnected() async {
    try {
      final connectivity = Connectivity();
      final results = await connectivity.checkConnectivity();
      
      return results.isNotEmpty && 
             results.first != ConnectivityResult.none &&
             !results.any((r) => r == ConnectivityResult.none);
    } catch (e) {
      return false;
    }
  }

  // Format file size for display
  String formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
    return '${(bytes / (1024 * 1024 * 1024)).toStringAsFixed(1)} GB';
  }

  // Get file icon based on type
  String getFileIcon(String fileType) {
    if (fileType.startsWith('image/')) return '📷';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.contains('pdf')) return '📄';
    if (fileType.contains('word') || fileType.contains('document')) return '📝';
    if (fileType.contains('excel') || fileType.contains('sheet')) return '📊';
    if (fileType.contains('powerpoint') || fileType.contains('presentation')) return '📽️';
    if (fileType.contains('zip') || fileType.contains('rar')) return '📦';
    if (fileType.contains('text')) return '📃';
    return '📄';
  }

  // Clear widget data
  Future<void> clearWidgetData() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_recentFilesKey);
      await prefs.remove(_storageInfoKey);
      await prefs.remove(_lastUpdateKey);
      
      debugPrint('Widget data cleared');
    } catch (e) {
      debugPrint('Failed to clear widget data: $e');
    }
  }

  // Get widget configuration
  Future<Map<String, dynamic>> getWidgetConfig() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      return {
        'showRecentFiles': prefs.getBool('widget_show_recent_files') ?? true,
        'showStorageInfo': prefs.getBool('widget_show_storage_info') ?? true,
        'maxRecentFiles': prefs.getInt('widget_max_recent_files') ?? 5,
        'autoUpdate': prefs.getBool('widget_auto_update') ?? true,
        'updateInterval': prefs.getInt('widget_update_interval') ?? 15, // minutes
      };
    } catch (e) {
      return {
        'showRecentFiles': true,
        'showStorageInfo': true,
        'maxRecentFiles': 5,
        'autoUpdate': true,
        'updateInterval': 15,
      };
    }
  }

  // Update widget configuration
  Future<void> updateWidgetConfig(Map<String, dynamic> config) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      
      if (config.containsKey('showRecentFiles')) {
        await prefs.setBool('widget_show_recent_files', config['showRecentFiles']);
      }
      if (config.containsKey('showStorageInfo')) {
        await prefs.setBool('widget_show_storage_info', config['showStorageInfo']);
      }
      if (config.containsKey('maxRecentFiles')) {
        await prefs.setInt('widget_max_recent_files', config['maxRecentFiles']);
      }
      if (config.containsKey('autoUpdate')) {
        await prefs.setBool('widget_auto_update', config['autoUpdate']);
      }
      if (config.containsKey('updateInterval')) {
        await prefs.setInt('widget_update_interval', config['updateInterval']);
      }
      
      debugPrint('Widget configuration updated');
    } catch (e) {
      debugPrint('Failed to update widget config: $e');
    }
  }

  // Generate widget data for Android home screen widget
  Future<Map<String, dynamic>> generateAndroidWidgetData() async {
    try {
      final widgetData = await getWidgetData();
      final config = await getWidgetConfig();
      
      return {
        'title': 'CloudNest',
        'subtitle': 'Recent Files',
        'showStorageInfo': config['showStorageInfo'],
        'showRecentFiles': config['showRecentFiles'],
        'maxRecentFiles': config['maxRecentFiles'],
        'lastUpdate': widgetData['lastUpdate'],
        'isConnected': widgetData['isConnected'],
        'storageInfo': widgetData['storageInfo'],
        'recentFiles': widgetData['recentFiles'],
      };
    } catch (e) {
      debugPrint('Failed to generate Android widget data: $e');
      return {
        'title': 'CloudNest',
        'subtitle': 'Recent Files',
        'showStorageInfo': false,
        'showRecentFiles': false,
        'maxRecentFiles': 0,
        'lastUpdate': DateTime.now().toIso8601String(),
        'isConnected': false,
        'storageInfo': '{}',
        'recentFiles': '[]',
      };
    }
  }
}
