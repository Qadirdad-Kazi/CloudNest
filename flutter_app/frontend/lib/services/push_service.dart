/// Push notifications - Firebase Cloud Messaging
/// Requires: Firebase setup (google-services.json, GoogleService-Info.plist)
/// Call PushService().init() after Firebase.initializeApp() in main()
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background: ${message.messageId}');
  
  // Show notification when app is in background
  await _showNotification(
    message.notification?.title ?? 'CloudNest',
    message.notification?.body ?? 'New notification',
    message.data,
  );
}

class PushService {
  static final PushService _instance = PushService._internal();
  factory PushService() => _instance;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  
  // Local notifications
  static final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();

  PushService._internal();

  Future<void> init() async {
    if (kIsWeb) return;
    
    try {
      // Initialize local notifications
      const AndroidInitializationSettings initializationSettingsAndroid =
          AndroidInitializationSettings('@mipmap/ic_launcher');
      const DarwinInitializationSettings initializationSettingsIOS =
          DarwinInitializationSettings();
      
      const InitializationSettings initializationSettings = InitializationSettings(
        android: initializationSettingsAndroid,
        iOS: initializationSettingsIOS,
      );
      
      await _notifications.initialize(initializationSettings);
      
      // Request notification permissions
      final settings = await _fcm.requestPermission(alert: true, badge: true, sound: true);
      
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        final token = await _fcm.getToken();
        debugPrint('FCM Token: $token');
        
        // Save token to local storage
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', token);
        
        // Handle foreground messages
        FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
        FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);
        
        // Handle token refresh
        FirebaseMessaging.onTokenRefresh.listen((token) {
          debugPrint('FCM Token refreshed: $token');
          prefs.setString('fcm_token', token);
        });
      }
    } catch (e) {
      debugPrint('PushService: $e');
    }
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    debugPrint('Foreground message: ${message.notification?.title}');
    
    // Show local notification for foreground messages
    await _showNotification(
      message.notification?.title ?? 'CloudNest',
      message.notification?.body ?? 'New notification',
      message.data,
    );
  }

  Future<void> _handleMessageOpenedApp(RemoteMessage message) async {
    debugPrint('Message opened app: ${message.notification?.title}');
    
    // Handle navigation based on message data
    if (message.data != null) {
      final action = message.data!['action'];
      final fileId = message.data!['fileId'];
      final folderId = message.data!['folderId'];
      
      // Navigate to specific file/folder
      if (action == 'file_shared' && fileId != null) {
        // Navigate to shared file
        debugPrint('Navigate to shared file: $fileId');
      } else if (action == 'folder_shared' && folderId != null) {
        // Navigate to shared folder
        debugPrint('Navigate to shared folder: $folderId');
      }
    }
  }

  static Future<void> _showNotification(String title, String body, Map<String, String>? data) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      '@mipmap/ic_launcher',
      title,
      body,
      importance: Importance.high,
      priority: Priority.high,
      autoCancel: true,
    );

    const NotificationDetails platformDetails = NotificationDetails(
      android: androidDetails,
      iOS: const DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      ),
    );

    await _notifications.show(
      0,
      title,
      body,
      platformDetails,
      payload: data?.toString(),
    );
  }

  Future<String?> getToken() => _fcm.getToken();
  Future<void> subscribeToTopic(String topic) => _fcm.subscribeToTopic(topic);
  
  // Send notification for file operations
  static Future<void> notifyFileOperation(String operation, String fileName, String? action) async {
    final title = _getNotificationTitle(operation);
    final body = '$fileName ${action ?? operation.toLowerCase()}';
    
    await _showNotification(title, body, {'operation': operation, 'fileName': fileName});
  }
  
  // Send notification for share operations
  static Future<void> notifyShareOperation(String operation, String fileName, String? shareLink) async {
    final title = 'File Shared';
    final body = '$fileName has been shared';
    
    await _showNotification(title, body, {
      'operation': 'file_shared',
      'fileName': fileName,
      'shareLink': shareLink ?? '',
    });
  }
  
  static String _getNotificationTitle(String operation) {
    switch (operation.toLowerCase()) {
      case 'upload':
        return 'File Uploaded';
      case 'download':
        return 'File Downloaded';
      case 'delete':
        return 'File Deleted';
      case 'share':
        return 'File Shared';
      case 'rename':
        return 'File Renamed';
      case 'move':
        return 'File Moved';
      default:
        return 'File Operation';
    }
  }
}
