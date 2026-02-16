# CloudNest Flutter Frontend

This is the Flutter mobile application frontend for CloudNest - a comprehensive cloud storage solution.

## Features

- **Multi-platform support**: Android, iOS, Web, Windows, macOS, Linux
- **Offline support**: SQLite database with local caching
- **Biometric authentication**: Fingerprint and face recognition
- **Push notifications**: Firebase integration
- **File management**: Upload, download, share, and organize files
- **Real-time sync**: Background sync with server
- **Home screen widgets**: Quick access to files
- **Image compression**: Optimize images before upload

## Prerequisites

- Flutter SDK 3.10.8 or higher
- Dart SDK 3.10.8 or higher
- Platform-specific tools:
  - **Android**: Android Studio, Android SDK
  - **iOS**: Xcode (macOS only)
  - **Windows**: Visual Studio 2022 with C++ development tools
  - **Linux**: GTK development libraries
  - **macOS**: Xcode Command Line Tools

## Setup

1. **Install dependencies**:
   ```bash
   flutter pub get
   ```

2. **Check Flutter setup**:
   ```bash
   flutter doctor
   ```

3. **Configure environment variables**:
   - Copy `.env.example` to `.env` (if exists)
   - Update API endpoints and other configurations

## Running the App

### Development Mode

```bash
# For specific platforms
flutter run -d chrome          # Web
flutter run -d android         # Android
flutter run -d ios             # iOS (macOS only)
flutter run -d windows         # Windows
flutter run -d macos           # macOS
flutter run -d linux           # Linux

# List all available devices
flutter devices
```

### Production Build

```bash
# Build for different platforms
flutter build web               # Web
flutter build apk               # Android APK
flutter build appbundle         # Android App Bundle
flutter build ios               # iOS (requires Xcode)
flutter build windows           # Windows
flutter build macos             # macOS
flutter build linux             # Linux
```

## Project Structure

```
frontend/
├── lib/                    # Dart source code
│   ├── main.dart           # App entry point
│   ├── screens/            # UI screens
│   ├── widgets/            # Reusable widgets
│   ├── services/           # API and business logic
│   ├── models/             # Data models
│   ├── providers/          # State management
│   ├── utils/              # Helper functions
│   └── theme/              # App theme and styling
├── android/                # Android-specific code
├── ios/                    # iOS-specific code
├── web/                    # Web-specific code
├── windows/                # Windows-specific code
├── linux/                  # Linux-specific code
├── macos/                  # macOS-specific code
├── test/                   # Test files
├── pubspec.yaml            # Dependencies and metadata
└── analysis_options.yaml   # Linting rules
```

## Key Dependencies

- **Networking**: `dio` for HTTP requests
- **State Management**: `provider` for state management
- **Local Storage**: `sqflite` for SQLite database
- **Authentication**: `local_auth` for biometrics
- **Notifications**: `firebase_messaging` for push notifications
- **File Handling**: `file_picker`, `path`, `permission_handler`
- **Background Tasks**: `workmanager` for background uploads
- **UI Components**: Material Design, `cached_network_image`

## Environment Configuration

The app connects to the backend server using the configuration in `lib/services/api_service.dart`. Make sure to update the API base URL to match your server deployment.

## Testing

```bash
# Run all tests
flutter test

# Run tests with coverage
flutter test --coverage
```

## Troubleshooting

1. **Build issues**: Run `flutter clean` then `flutter pub get`
2. **Platform-specific issues**: Check `flutter doctor` for missing dependencies
3. **Network issues**: Ensure the backend server is running and accessible
4. **Permission issues**: Grant necessary permissions for file access

## Deployment

See the main [BUILD_AND_DEPLOYMENT_GUIDE.md](../BUILD_AND_DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions for all platforms.
