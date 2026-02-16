# CloudNest Flutter App

A complete Flutter mobile/desktop app for **CloudNest** cloud storage, sharing the same backend (Node.js/Express) and MongoDB database as the MERN web application.

## Features

- **Authentication**: Login, Register, JWT-based auth
- **My Drive**: Browse files and folders, breadcrumb navigation
- **File Management**: Upload, rename, delete, star, share files
- **Folder Management**: Create, rename, delete, star folders
- **Starred**: View starred files
- **Recent**: Recently accessed files
- **Shared**: Manage share links
- **Trash**: Restore or permanently delete items
- **Profile & Settings**: User profile, dark mode toggle
- **Theme**: Indigo/blue color scheme matching the web app

## Prerequisites

- Flutter SDK 3.10+
- CloudNest backend server running (see parent `/server` directory)
- MongoDB database configured

## Setup

### 1. Configure API URL

Edit `lib/config/api_config.dart` and set `baseUrl` to your backend:

- **Android emulator**: `http://10.0.2.2:5001/api`
- **iOS simulator / web**: `http://localhost:5001/api`
- **Physical device**: `http://YOUR_COMPUTER_IP:5001/api` (e.g. `http://192.168.1.100:5001/api`)

### 2. Run the app

```bash
cd flutter_app
flutter pub get
flutter run
```

## Project Structure

```
lib/
├── config/         # API configuration
├── models/         # User, File, Folder, ShareLink, StorageInfo
├── providers/      # AuthProvider, ThemeProvider
├── screens/        # All screen widgets
├── services/       # API, Auth, File, Folder, Share services
├── theme/          # App theme (light/dark)
├── utils/          # Helpers (formatBytes, formatDate)
├── widgets/        # Reusable widgets (Sidebar, FileCard, FolderCard)
└── main.dart       # App entry point
```

## Backend Compatibility

This app uses the same REST API as the MERN web client:

- `/api/auth/*` - Authentication
- `/api/files/*` - File operations
- `/api/folders/*` - Folder operations
- `/api/shares/*` - Share links
- `/api/users/*` - User profile, settings, storage

Ensure your CloudNest server is running and CORS allows requests from your app's origin.
