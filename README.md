# CloudNest

A cloud storage platform with **Web** (React) and **Flutter** (mobile/desktop) clients. Web uses its own backend; the Flutter app has a separate backend (`app_server`).

## Architecture

```
CloudNest/
├── Web/                    # Web app (React + its backend)
│   ├── src/                # React frontend
│   └── server/             # Node.js backend (Web only, port 5001)
├── app_server/             # Node.js backend for Flutter app (port 5002)
└── flutter_app/            # Flutter mobile/desktop app
```

- **Web**: React app + `Web/server` (port 5001)
- **Flutter app**: Uses `app_server` (port 5002)
- Both backends can share the same MongoDB

## Flutter App Features

- Offline mode – cache files, use when offline
- Biometric auth – fingerprint / Face ID
- Push notifications – FCM (Firebase)
- In-app file preview – images, open PDFs externally
- Download to device – save to storage
- Image compression – before upload
- Pull-to-refresh
- Swipe actions – star, share, delete
- Search – files and folders
- Background sync – Workmanager
- Home screen widget – recent/starred

## Quick Start

### Web (React + server)

```bash
cd Web
npm install
cd server && npm install && npm run dev &
cd .. && npm run dev
# Open http://localhost:5173
```

### Flutter app + app_server

```bash
# Terminal 1: app_server
cd app_server
npm install
# Create .env (copy from .env.example), set PORT=5002
npm run dev

# Terminal 2: Flutter
cd flutter_app
flutter pub get
# Edit lib/config/api_config.dart – baseUrl: http://localhost:5002/api (or 10.0.2.2:5002 for Android emulator)
flutter run
```

### Environment

- **Web/server**: `Web/server/.env` (PORT=5001)
- **app_server**: `app_server/.env` (PORT=5002)

See `.env.example` in each backend.

## License

MIT
