/// Push notifications - Firebase Cloud Messaging
/// Requires: Firebase setup (google-services.json, GoogleService-Info.plist)
/// Call PushService().init() after Firebase.initializeApp() in main()
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('Background: ${message.messageId}');
}

class PushService {
  static final PushService _instance = PushService._internal();
  factory PushService() => _instance;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  PushService._internal();

  Future<void> init() async {
    if (kIsWeb) return;
    try {
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
      final settings = await _fcm.requestPermission(alert: true, badge: true, sound: true);
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        final token = await _fcm.getToken();
        debugPrint('FCM Token: $token');
        FirebaseMessaging.onMessage.listen((m) => debugPrint('Message: ${m.notification?.title}'));
        FirebaseMessaging.onMessageOpenedApp.listen((m) => debugPrint('Opened: ${m.notification?.title}'));
      }
    } catch (e) {
      debugPrint('PushService: $e');
    }
  }

  Future<String?> getToken() => _fcm.getToken();
  Future<void> subscribeToTopic(String topic) => _fcm.subscribeToTopic(topic);
}
