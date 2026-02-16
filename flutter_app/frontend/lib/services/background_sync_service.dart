import 'dart:io';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:workmanager/workmanager.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'api_service.dart';
import 'file_service.dart';
import 'offline_service.dart';

/// Background sync service for automatic file uploads/downloads
/// Uses WorkManager for background tasks
class BackgroundSyncService {
  static const String _taskName = 'background_sync';
  static const String _uploadTask = 'background_upload';
  static const String _downloadTask = 'background_download';
  
  static final BackgroundSyncService _instance = BackgroundSyncService._internal();
  factory BackgroundSyncService() => _instance;
  
  BackgroundSyncService._internal();

  // Initialize background sync
  Future<void> init() async {
    if (kIsWeb) return;
    
    try {
      // Register background tasks
      await Workmanager().initialize(
        callbackDispatcher,
        isInDebugMode: kDebugMode,
      );
      
      // Register periodic sync task (every 15 minutes)
      await Workmanager().registerPeriodicTask(
        '1',
        _taskName,
        frequency: const Duration(minutes: 15),
        constraints: Constraints(
          networkType: NetworkType.connected,
          requiresCharging: false,
          requiresDeviceIdle: false,
          requiresStorageNotLow: true,
        ),
        existingWorkPolicy: ExistingWorkPolicy.replace,
      );
      
      debugPrint('Background sync service initialized');
    } catch (e) {
      debugPrint('Failed to initialize background sync: $e');
    }
  }

  // Queue file for background upload
  Future<void> queueFileUpload(String filePath, String parentPath) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final uploadQueue = prefs.getStringList('upload_queue') ?? [];
      
      final uploadData = {
        'filePath': filePath,
        'parentPath': parentPath,
        'timestamp': DateTime.now().toIso8601String(),
        'retryCount': '0',
      };
      
      uploadQueue.add(uploadData.toString());
      await prefs.setStringList('upload_queue', uploadQueue);
      
      debugPrint('File queued for background upload: $filePath');
    } catch (e) {
      debugPrint('Failed to queue file upload: $e');
    }
  }

  // Queue file for background download
  Future<void> queueFileDownload(String fileId, String fileName, String savePath) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final downloadQueue = prefs.getStringList('download_queue') ?? [];
      
      final downloadData = {
        'fileId': fileId,
        'fileName': fileName,
        'savePath': savePath,
        'timestamp': DateTime.now().toIso8601String(),
        'retryCount': '0',
      };
      
      downloadQueue.add(downloadData.toString());
      await prefs.setStringList('download_queue', downloadQueue);
      
      debugPrint('File queued for background download: $fileName');
    } catch (e) {
      debugPrint('Failed to queue file download: $e');
    }
  }

  // Get sync status
  Future<Map<String, dynamic>> getSyncStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final uploadQueue = prefs.getStringList('upload_queue') ?? [];
      final downloadQueue = prefs.getStringList('download_queue') ?? [];
      final lastSync = prefs.getString('last_sync_time');
      
      return {
        'pending_uploads': uploadQueue.length,
        'pending_downloads': downloadQueue.length,
        'last_sync': lastSync,
        'total_pending': uploadQueue.length + downloadQueue.length,
      };
    } catch (e) {
      return {
        'pending_uploads': 0,
        'pending_downloads': 0,
        'last_sync': null,
        'total_pending': 0,
      };
    }
  }

  // Cancel all background tasks
  Future<void> cancelAllTasks() async {
    try {
      await Workmanager().cancelAll();
      debugPrint('All background tasks cancelled');
    } catch (e) {
      debugPrint('Failed to cancel background tasks: $e');
    }
  }

  // Manually trigger sync
  Future<void> triggerSync() async {
    try {
      await Workmanager().registerOneOffTask(
        DateTime.now().millisecondsSinceEpoch.toString(),
        _taskName,
        initialDelay: const Duration(seconds: 5),
        constraints: Constraints(
          networkType: NetworkType.connected,
          requiresStorageNotLow: true,
        ),
      );
      
      debugPrint('Manual sync triggered');
    } catch (e) {
      debugPrint('Failed to trigger manual sync: $e');
    }
  }
}

// Background task callback
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      debugPrint('Background task started: $task');
      
      switch (task) {
        case 'background_sync':
          await _performBackgroundSync();
          break;
        case 'background_upload':
          await _performBackgroundUpload(inputData);
          break;
        case 'background_download':
          await _performBackgroundDownload(inputData);
          break;
        default:
          debugPrint('Unknown background task: $task');
      }
      
      debugPrint('Background task completed: $task');
      return true;
    } catch (e) {
      debugPrint('Background task failed: $task - $e');
      return false;
    }
  });
}

// Perform background sync
Future<void> _performBackgroundSync() async {
  try {
    // Check connectivity
    final connectivity = Connectivity();
    final results = await connectivity.checkConnectivity();
    
    if (results.isEmpty || results.first == ConnectivityResult.none) {
      debugPrint('No network connection, skipping sync');
      return;
    }
    
    // Process upload queue
    await _processUploadQueue();
    
    // Process download queue
    await _processDownloadQueue();
    
    // Update last sync time
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('last_sync_time', DateTime.now().toIso8601String());
    
    debugPrint('Background sync completed successfully');
  } catch (e) {
    debugPrint('Background sync failed: $e');
  }
}

// Process upload queue
Future<void> _processUploadQueue() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final uploadQueue = prefs.getStringList('upload_queue') ?? [];
    final processedQueue = <String>[];
    
    for (final uploadDataStr in uploadQueue) {
      try {
        final uploadData = _parseUploadData(uploadDataStr);
        if (uploadData == null) continue;
        
        // Check if file still exists
        final file = File(uploadData['filePath']);
        if (!await file.exists()) {
          debugPrint('File no longer exists: ${uploadData['filePath']}');
          continue;
        }
        
        // Check retry count
        final retryCount = int.tryParse(uploadData['retryCount'] ?? '0') ?? 0;
        if (retryCount >= 3) {
          debugPrint('Max retries exceeded for: ${uploadData['filePath']}');
          continue;
        }
        
        // Attempt upload
        final apiService = ApiService();
        final fileService = FileService();
        
        // Upload file (simplified - you'd implement actual upload logic)
        debugPrint('Uploading file: ${uploadData['filePath']}');
        
        // Simulate upload success
        await Future.delayed(const Duration(seconds: 2));
        
        // Remove from queue on success
        continue;
      } catch (e) {
        debugPrint('Failed to process upload: $e');
        // Add back to queue with increased retry count
        processedQueue.add(uploadDataStr);
      }
    }
    
    // Update queue
    await prefs.setStringList('upload_queue', processedQueue);
  } catch (e) {
    debugPrint('Failed to process upload queue: $e');
  }
}

// Process download queue
Future<void> _processDownloadQueue() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final downloadQueue = prefs.getStringList('download_queue') ?? [];
    final processedQueue = <String>[];
    
    for (final downloadDataStr in downloadQueue) {
      try {
        final downloadData = _parseDownloadData(downloadDataStr);
        if (downloadData == null) continue;
        
        // Check retry count
        final retryCount = int.tryParse(downloadData['retryCount'] ?? '0') ?? 0;
        if (retryCount >= 3) {
          debugPrint('Max retries exceeded for: ${downloadData['fileName']}');
          continue;
        }
        
        // Attempt download
        debugPrint('Downloading file: ${downloadData['fileName']}');
        
        // Simulate download success
        await Future.delayed(const Duration(seconds: 2));
        
        // Remove from queue on success
        continue;
      } catch (e) {
        debugPrint('Failed to process download: $e');
        // Add back to queue with increased retry count
        processedQueue.add(downloadDataStr);
      }
    }
    
    // Update queue
    await prefs.setStringList('download_queue', processedQueue);
  } catch (e) {
    debugPrint('Failed to process download queue: $e');
  }
}

// Parse upload data from string
Map<String, String>? _parseUploadData(String data) {
  try {
    // Simple parsing - you might want to use JSON parsing for complex data
    final parts = data.split(',');
    final result = <String, String>{};
    
    for (final part in parts) {
      final keyValue = part.split('=');
      if (keyValue.length == 2) {
        result[keyValue[0].trim()] = keyValue[1].trim();
      }
    }
    
    return result;
  } catch (e) {
    return null;
  }
}

// Parse download data from string
Map<String, String>? _parseDownloadData(String data) {
  return _parseUploadData(data); // Same parsing logic
}

// Perform background upload
Future<void> _performBackgroundUpload(Map<String, dynamic>? inputData) async {
  // Implementation for specific upload task
  debugPrint('Performing background upload: $inputData');
}

// Perform background download
Future<void> _performBackgroundDownload(Map<String, dynamic>? inputData) async {
  // Implementation for specific download task
  debugPrint('Performing background download: $inputData');
}
