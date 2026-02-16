# CloudNest Flutter App - Build & Deployment Guide

## Table of Contents
1. [Project Structure](#project-structure)
2. [Prerequisites](#prerequisites)
3. [Setup Instructions](#setup-instructions)
4. [Running the App](#running-the-app)
5. [Building for All Platforms](#building-for-all-platforms)
6. [Server Integration](#server-integration)
7. [Deployment Options](#deployment-options)

## Project Structure

```
flutter_app/
├── app_server/          # Node.js backend server
│   ├── config/         # Database and Cloudinary config
│   ├── controllers/    # API controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   ├── middleware/     # Express middleware
│   ├── scripts/        # Utility scripts
│   ├── uploads/        # Local file uploads
│   ├── package.json    # Node.js dependencies
│   └── index.js        # Server entry point
├── lib/                # Flutter app source code
├── android/            # Android platform code
├── ios/                # iOS platform code
├── web/                # Web platform code
├── windows/            # Windows desktop code
├── linux/              # Linux desktop code
├── macos/              # macOS desktop code
└── pubspec.yaml        # Flutter dependencies
```

## Prerequisites

### For Flutter App:
- **Flutter SDK**: 3.10.8 or higher
- **Dart SDK**: 3.10.8 or higher
- **Platform-specific tools**:
  - **Android**: Android Studio, Android SDK
  - **iOS**: Xcode (macOS only)
  - **Windows**: Visual Studio 2022 with C++ development tools
  - **Linux**: GTK development libraries
  - **macOS**: Xcode Command Line Tools

### For Backend Server:
- **Node.js**: 18.0.0 or higher
- **npm**: Latest version
- **MongoDB**: For local development
- **Cloudinary Account**: For file storage

## Setup Instructions

### 1. Flutter App Setup

```bash
# Navigate to flutter_app directory
cd flutter_app

# Install Flutter dependencies
flutter pub get

# Check Flutter setup
flutter doctor
```

### 2. Backend Server Setup

```bash
# Navigate to app_server directory
cd app_server

# Install Node.js dependencies
npm install

# Copy environment file and configure
cp .env.example .env

# Edit .env with your configuration:
# - MONGODB_URI: Your MongoDB connection string
# - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
# - CLOUDINARY_API_KEY: Your Cloudinary API key
# - CLOUDINARY_API_SECRET: Your Cloudinary API secret
# - JWT_SECRET: Your JWT secret key
# - PORT: Server port (default: 5001)
```

## Running the App

### Option 1: Development Mode (Recommended)

#### Start Backend Server:
```bash
cd flutter_app/app_server
npm run dev  # Uses nodemon for auto-restart
```

#### Start Flutter App:

**For Chrome (Web):**
```bash
cd flutter_app
flutter run -d chrome --web-port 3000
```

**For Mobile Devices:**
```bash
# Android
flutter run -d android

# iOS (macOS only)
flutter run -d ios

# List all available devices
flutter devices
```

**For Desktop:**
```bash
# Windows
flutter run -d windows

# macOS
flutter run -d macos

# Linux
flutter run -d linux
```

### Option 2: Production Mode

#### Start Backend Server:
```bash
cd flutter_app/app_server
npm start
```

#### Start Flutter App in Release Mode:
```bash
cd flutter_app
flutter run --release -d chrome
```

## Building for All Platforms

### Web Application
```bash
# Build for web
flutter build web

# Output: flutter_app/build/web/
# Can be deployed to any static hosting service
```

### Android Application
```bash
# Build APK
flutter build apk --release

# Build App Bundle (Recommended for Play Store)
flutter build appbundle --release

# Output: flutter_app/build/app/outputs/
```

### iOS Application
```bash
# Build for iOS (macOS only)
flutter build ios --release

# Then open in Xcode:
open ios/Runner.xcworkspace
# In Xcode: Product > Archive
```

### Windows Desktop
```bash
# Build Windows executable
flutter build windows --release

# Output: flutter_app/build/windows/runner/Release/
```

### Linux Desktop
```bash
# Build Linux executable
flutter build linux --release

# Output: flutter_app/build/linux/
```

### macOS Desktop
```bash
# Build macOS app
flutter build macos --release

# Output: flutter_app/build/macos/Build/Products/Release/
```

## Server Integration

### Important: Server is NOT Auto-Integrated

**The backend server must be running separately** - it is NOT automatically integrated when you build the Flutter app. Here's what you need to know:

#### During Development:
1. **Start the server first**: `cd app_server && npm run dev`
2. **Then run the Flutter app**: `flutter run -d chrome`
3. The Flutter app connects to the server at `http://localhost:5001`

#### For Production Deployment:
You have **two main options**:

##### Option A: Separate Deployment (Recommended)
- Deploy the Flutter app to a hosting service (Vercel, Netlify, AWS S3, etc.)
- Deploy the Node.js server separately (Heroku, AWS, DigitalOcean, Vercel Serverless, etc.)
- Update the Flutter app's API endpoint to point to your deployed server

##### Option B: Self-Contained Deployment
- Use a service like **Vercel Serverless** (already configured)
- The server runs as serverless functions
- Both frontend and backend are deployed together

### API Configuration

The Flutter app needs to know where to find the server. Update this in your Flutter code:

```dart
// In your API service file
const String API_BASE_URL = kDebugMode 
    ? 'http://localhost:5001'  // Development
    : 'https://your-server-domain.com';  // Production
```

## Deployment Options

### 1. Web App Deployment

#### Vercel (Recommended for Web)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy web build
cd flutter_app
flutter build web
cd build/web
vercel --prod
```

#### Netlify
```bash
# Build the app
flutter build web

# Upload build/web folder to Netlify
```

#### AWS S3 + CloudFront
```bash
# Build the app
flutter build web

# Upload build/web to S3 bucket
# Configure CloudFront distribution
```

### 2. Backend Server Deployment

#### Vercel Serverless (Already Configured)
```bash
cd app_server
vercel --prod
```

#### Heroku
```bash
cd app_server
heroku create your-app-name
git push heroku main
```

#### AWS EC2 or DigitalOcean
```bash
# Set up server instance
# Clone repository
# Install dependencies
# Configure environment variables
# Run with PM2 for production:
npm install -g pm2
pm2 start index.js --name "cloudnest-server"
```

### 3. Mobile App Deployment

#### Google Play Store (Android)
1. Build App Bundle: `flutter build appbundle --release`
2. Create Google Play Console account
3. Upload App Bundle
4. Complete store listing and release

#### Apple App Store (iOS)
1. Build iOS app: `flutter build ios --release`
2. Open in Xcode: `open ios/Runner.xcworkspace`
3. Configure signing and certificates
4. Archive and upload to App Store Connect

### 4. Desktop App Distribution

#### Windows
- Build executable: `flutter build windows --release`
- Create installer using tools like Inno Setup or WiX Toolset
- Distribute via website or Microsoft Store

#### macOS
- Build app: `flutter build macos --release`
- Create .dmg installer
- Distribute via website or Mac App Store

#### Linux
- Build executable: `flutter build linux --release`
- Create .deb or .rpm packages
- Distribute via website or Snap Store

## Environment Variables

### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/cloudnest

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Server
PORT=5001
NODE_ENV=production

# CORS (for production)
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Flutter (lib/config/app_config.dart)
```dart
class AppConfig {
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:5001',
  );
  
  static const bool isDebugMode = kDebugMode;
}
```

## Troubleshooting

### Common Issues:

1. **Server Connection Refused**
   - Ensure the backend server is running
   - Check if the port (5001) is available
   - Verify firewall settings

2. **Build Failures**
   - Run `flutter clean` then `flutter pub get`
   - Check platform-specific requirements
   - Update Flutter SDK: `flutter upgrade`

3. **CORS Errors**
   - Update ALLOWED_ORIGINS in .env
   - Check server CORS configuration

4. **Database Connection Issues**
   - Verify MongoDB is running
   - Check connection string in .env
   - Ensure MongoDB credentials are correct

### Development Tips:

- Use `flutter logs` to view app logs
- Use Chrome DevTools for web debugging
- Use platform-specific debuggers for mobile/desktop
- Always test on real devices before deployment

## Security Considerations

1. **Never commit .env files** to version control
2. **Use HTTPS** in production
3. **Implement proper authentication** and authorization
4. **Validate all user inputs** on both client and server
5. **Keep dependencies updated** to avoid security vulnerabilities
6. **Use environment-specific configurations** for different deployment stages

## Performance Optimization

1. **Enable web renderer**: Use `flutter run -d chrome --web-renderer canvaskit`
2. **Optimize images**: Use WebP format and appropriate sizes
3. **Implement lazy loading** for large lists
4. **Use caching** for API responses
5. **Minimize app size**: Remove unused dependencies and assets

---

For additional support, refer to the official Flutter documentation: https://flutter.dev/docs
