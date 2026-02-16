# Firebase Setup Guide

This guide will help you set up Firebase for the CloudNest Flutter application.

## 🚀 **Quick Start**

### **1. Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `CloudNest`
4. Click "Continue"
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"

### **2. Get Firebase Configuration**

Once your project is created, you'll need to get the configuration details:

#### **Get API Key**
1. Go to Project Settings → General
2. Scroll down to "Your apps" section
3. Click on the Web App icon (or create one if not present)
4. Copy the API Key

#### **Get Project ID**
1. In Project Settings → General, you'll find the Project ID
2. Copy the Project ID

#### **Get App ID**
1. In Project Settings → General → Your apps
2. Click on the Web App
3. Copy the App ID

#### **Get Sender ID**
1. Go to Project Settings → Cloud Messaging
2. Copy the Sender ID

### **3. Update Firebase Configuration**

Open `lib/config/firebase_config.dart` and replace the placeholder values with your actual Firebase credentials:

```dart
class FirebaseConfig {
  // Replace these with your actual Firebase project credentials
  static const String _apiKey = 'YOUR_API_KEY_HERE';
  static const String _authDomain = 'YOUR_PROJECT.firebaseapp.com';
  static const String _projectId = 'YOUR_PROJECT_ID';
  static const String _storageBucket = 'YOUR_PROJECT.appspot.com';
  static const String _messagingSenderId = 'YOUR_SENDER_ID';
  static const String _appId = 'YOUR_APP_ID';
  
  // ... rest of the file remains the same
}
```

### **4. Enable Required Firebase Services**

#### **For Push Notifications**
1. In Firebase Console, go to Project Settings → Cloud Messaging
2. Click "Get started" or "Manage API keys"
3. Generate a new Web Push certificate
4. Download the certificate files

#### **For Cloud Storage**
1. In Firebase Console, go to Storage → Get started
2. Follow the setup instructions
3. Update storage rules if needed

#### **For Authentication**
1. In Firebase Console, go to Authentication → Get started
2. Enable Email/Password sign-in method
3. Configure additional providers as needed

## 🔧 **Firebase Services Used**

### **Push Notifications**
- Firebase Cloud Messaging (FCM)
- Local notifications
- Background message handling

### **Authentication**
- Firebase Authentication
- Email/Password sign-in
- Social providers (Google, Facebook, etc.)

### **Cloud Storage**
- Firebase Storage for file uploads
- Secure file storage
- Download URLs

### **Analytics**
- Firebase Analytics (optional)
- User behavior tracking
- App performance monitoring

## 📱 **Platform-Specific Setup**

### **Web Setup**
1. Enable Firebase Hosting (optional)
2. Configure CORS settings if needed
3. Update web app manifest

### **Mobile Setup**
1. Add `google-services.json` (Android)
2. Add `GoogleService-Info.plist` (iOS)
3. Update platform-specific configurations

### **Flutter Web Setup**
1. Ensure `firebase_core_web` is in `pubspec.yaml`
2. Update `web/index.html` with Firebase SDK
3. Configure CORS for local development

## 🔧 **Configuration Files**

### **pubspec.yaml Dependencies**
```yaml
dependencies:
  firebase_core: ^3.15.2
  firebase_messaging: ^15.2.10
  firebase_core_web: ^2.24.1
  flutter_local_notifications: ^17.2.2
```

### **Web Configuration**
Update `web/index.html` to include Firebase SDK:

```html
<!-- Add this in the head section -->
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js"></script>
```

### **Android Configuration**
Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
  <service
      android:name="io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingService"
      android:exported="false">
    <intent-filter>
      <action android:name="FLUTTER_NOTIFICATION_CLICK" />
      <category android:name="android.intent.category.DEFAULT" />
    </intent-filter>
  </service>
</application>
```

### **iOS Configuration**
Add to `ios/Runner/Info.plist`:

```xml
<key>NSUserNotificationUsageDescription</key>
<string>This app uses notifications to keep you informed about important events.</string>
<key>NSUserNotificationAlertSetting</key>
<string>YES</string>
```

## 🔍 **Environment Variables**

For production deployments, you can use environment variables:

```dart
class FirebaseConfig {
  static String get _apiKey => 
      dotenv.env['FIREBASE_API_KEY'] ?? _apiKey;
  
  static String get _projectId => 
      dotenv.env['FIREBASE_PROJECT_ID'] ?? _projectId;
  
  // ... other configurations
}
```

## 🚨 **Testing Firebase Setup**

### **Test Firebase Connection**
Run the app and check the console for:
- "Firebase initialized successfully" message
- No Firebase initialization errors
- Firebase services working correctly

### **Test Push Notifications**
1. Try sending a test notification
2. Check browser notification permissions
3. Verify notification appears correctly

### **Test Authentication**
1. Try signing in with email/password
2. Test social provider authentication
3. Verify user session persistence

### **Test Cloud Storage**
1. Try uploading a file
2. Verify file appears in Firebase Console
3. Test file download functionality

## 🔒 **Security Best Practices**

### **API Key Security**
- Never commit API keys to version control
- Use environment variables for production
- Restrict API key usage to your domains

### **Firebase Rules**
- Configure Firebase Security Rules
- Restrict database access
- Set up proper read/write permissions

### **Data Protection**
- Enable data encryption
- Configure data retention policies
- Set up backup and recovery

## 🐛 **Troubleshooting**

### **Common Issues**

**"FirebaseOptions cannot be null" Error**
- Ensure FirebaseOptions is properly configured
- Check all required fields are filled
- Verify placeholder values are replaced

**"No such module 'firebase_core_web'" Error**
- Ensure `firebase_core_web` is in pubspec.yaml
- Run `flutter pub get`
- Restart the development server

**"Failed to initialize Firebase" Error**
- Check Firebase project configuration
- Verify API key is correct
- Ensure project ID matches

**Push Notifications Not Working**
- Check browser notification permissions
- Verify Firebase Cloud Messaging setup
- Test with different browsers

### **Debugging Tips**
- Check browser console for Firebase errors
- Use Firebase DebugView for real-time debugging
- Verify Firebase project configuration in console

## 📚 **Firebase Console Features**

### **Authentication**
- Manage authentication methods
- Configure social providers
- Set up email templates
- Monitor user activity

### **Cloud Storage**
- Upload and manage files
- Configure security rules
- Monitor storage usage
- Set up lifecycle rules

### **Cloud Messaging**
- Send push notifications
- Manage notification campaigns
- Analyze message delivery
- Configure notification settings

### **Analytics**
- Track user behavior
- Monitor app performance
- Set up custom events
- Create custom reports

### **Hosting**
- Deploy web apps
- Configure custom domains
- Set up SSL certificates
- Monitor hosting performance

## 📱 **Additional Resources**

### **Official Documentation**
- [Flutter Firebase Documentation](https://firebase.flutter.dev/docs/overview)
- [Firebase Core Documentation](https://firebase.google.com/docs)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### **Community Resources**
- FlutterFire GitHub repository
- Firebase Flutter community forums
- Stack Overflow Firebase questions
- YouTube tutorials and guides

### **Tools and Libraries**
- FlutterFire package documentation
- Firebase CLI tools
- Firebase Admin SDK
- Firebase Emulator Suite

---

## 🎯 **Next Steps**

Once Firebase is properly configured:

1. **Test All Features**: Verify all Firebase-dependent features work
2. **Configure Production**: Set up production Firebase settings
3. **Monitor Usage**: Use Firebase Console to monitor app usage
4. **Optimize Performance**: Use Firebase Analytics to improve performance
5. **Scale Up**: Upgrade Firebase plan as needed

---

*This guide will help you successfully set up Firebase for the CloudNest Flutter application.*
