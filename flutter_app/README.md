# CloudNest Flutter Application

A comprehensive cloud storage solution built with Flutter for mobile platforms and Node.js for the backend.

## Project Structure

```
flutter_app/
├── frontend/               # Flutter mobile application
│   ├── lib/              # Dart source code
│   ├── android/           # Android platform code
│   ├── ios/               # iOS platform code
│   ├── web/               # Web platform code
│   ├── windows/           # Windows desktop code
│   ├── linux/             # Linux desktop code
│   ├── macos/             # macOS desktop code
│   ├── test/              # Test files
│   ├── pubspec.yaml       # Flutter dependencies
│   └── README.md          # Frontend-specific documentation
├── backend/               # Node.js backend server
│   ├── config/            # Server configuration
│   ├── controllers/       # API controllers
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── middleware/        # Express middleware
│   ├── scripts/           # Utility scripts
│   ├── uploads/           # Local file uploads
│   ├── package.json       # Node.js dependencies
│   └── README.md          # Backend-specific documentation
├── BUILD_AND_DEPLOYMENT_GUIDE.md  # Comprehensive build/deployment guide
└── README.md              # This file
```

## Features

### Flutter Frontend
- **Multi-platform Support**: Android, iOS, Web, Desktop (Windows, macOS, Linux)
- **Offline Support**: SQLite database with local caching
- **Biometric Authentication**: Fingerprint and face recognition
- **Push Notifications**: Firebase integration
- **File Management**: Upload, download, share, and organize files
- **Real-time Sync**: Background sync with server
- **Home Screen Widgets**: Quick access to files
- **Image Compression**: Optimize images before upload

### Node.js Backend
- **RESTful API**: Complete CRUD operations
- **Authentication**: JWT-based with refresh tokens
- **File Storage**: Cloudinary integration
- **Real-time Features**: WebSocket support
- **Database**: MongoDB with Mongoose ODM
- **Security**: Rate limiting, CORS, input validation
- **Monitoring**: Activity logging and system metrics
- **Admin Dashboard**: User management and analytics

## Quick Start

### Prerequisites

- **Flutter SDK**: 3.10.8 or higher
- **Node.js**: 18.0.0 or higher
- **MongoDB**: For local development
- **Cloudinary Account**: For file storage

### Setup Instructions

1. **Setup Backend Server**:
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

2. **Setup Flutter Frontend**:
   ```bash
   cd frontend
   flutter pub get
   flutter doctor
   ```

3. **Run the Application**:
   ```bash
   # Start backend server (in backend/ directory)
   npm run dev

   # Start Flutter app (in frontend/ directory)
   flutter run -d chrome    # For web
   flutter run -d android   # For Android
   flutter run -d ios       # For iOS (macOS only)
   ```

## Documentation

- **[BUILD_AND_DEPLOYMENT_GUIDE.md](./BUILD_AND_DEPLOYMENT_GUIDE.md)**: Comprehensive guide for building and deploying the app on all platforms
- **[frontend/README.md](./frontend/README.md)**: Flutter frontend-specific documentation
- **[backend/README.md](./backend/README.md)**: Node.js backend-specific documentation
