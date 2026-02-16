import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

class FirebaseConfig {
  // Replace these with your actual Firebase project credentials
  static const String _apiKey = 'YOUR_API_KEY_HERE';
  static const String _authDomain = 'YOUR_PROJECT.firebaseapp.com';
  static const String _projectId = 'YOUR_PROJECT_ID';
  static const String _storageBucket = 'YOUR_PROJECT.appspot.com';
  static const String _messagingSenderId = 'YOUR_SENDER_ID';
  static const String _appId = 'YOUR_APP_ID';

  static FirebaseOptions get _options => FirebaseOptions(
    apiKey: _apiKey,
    authDomain: _authDomain,
    projectId: _projectId,
    storageBucket: _storageBucket,
    messagingSenderId: _messagingSenderId,
    appId: _appId,
  );

  static Future<void> initializeFirebase() async {
    try {
      if (kIsWeb) {
        await Firebase.initializeApp(options: _options);
      } else {
        await Firebase.initializeApp(options: _options);
      }
      debugPrint('Firebase initialized successfully');
    } catch (e) {
      debugPrint('Failed to initialize Firebase: $e');
      rethrow;
    }
  }

  static bool get isInitialized {
    try {
      return Firebase.apps.isNotEmpty;
    } catch (e) {
      return false;
    }
  }
}
