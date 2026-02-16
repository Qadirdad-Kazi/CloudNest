# CloudNest Backend Server

This is the Node.js backend server for CloudNest - providing RESTful APIs and real-time features for the Flutter mobile app and web frontend.

## Features

- **RESTful API**: Complete CRUD operations for files, folders, users
- **Authentication**: JWT-based authentication with refresh tokens
- **File Storage**: Cloudinary integration for cloud file storage
- **Real-time Features**: WebSocket support for live updates
- **Database**: MongoDB for data persistence
- **Security**: Rate limiting, CORS, input validation
- **Monitoring**: Activity logging and system metrics
- **Admin Dashboard**: User management and analytics

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary
- **Authentication**: JWT + bcrypt
- **Real-time**: WebSocket (ws)
- **Logging**: Winston with daily rotation
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js 18.0.0 or higher
- npm (latest version)
- MongoDB (local or cloud instance)
- Cloudinary account

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables** in `.env`:
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
   NODE_ENV=development

   # CORS (for production)
   ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
   ```

## Running the Server

### Development Mode

```bash
# With nodemon (auto-restart on changes)
npm run dev

# Or with regular node
npm start
```

### Production Mode

```bash
# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start index.js --name "cloudnest-server"
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Files
- `GET /api/files` - List files
- `POST /api/files/upload` - Upload file
- `GET /api/files/download/:id` - Download file
- `PUT /api/files/update/:id` - Update file
- `DELETE /api/files/delete/:id` - Delete file
- `POST /api/files/trash/:id` - Move to trash
- `POST /api/files/restore/:id` - Restore from trash
- `POST /api/files/star/:id` - Star/unstar file
- `GET /api/files/starred` - Get starred files
- `GET /api/files/recent` - Get recent files
- `GET /api/files/trash` - Get trashed files
- `DELETE /api/files/trash/empty` - Empty trash

### Folders
- `GET /api/folders` - List folders
- `POST /api/folders/create` - Create folder
- `PUT /api/folders/update/:id` - Update folder
- `DELETE /api/folders/delete/:id` - Delete folder
- `POST /api/folders/star/:id` - Star/unstar folder
- `POST /api/folders/trash/:id` - Move to trash
- `POST /api/folders/restore/:id` - Restore from trash

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/settings` - Update settings
- `POST /api/users/avatar` - Update avatar
- `GET /api/users/storage` - Get storage info

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User management
- `GET /api/admin/analytics/storage` - Storage analytics
- `GET /api/admin/analytics/activity` - Activity analytics
- `GET /api/admin/system/health` - System health
- `GET /api/admin/system/metrics` - System metrics

### Notifications
- `GET /api/notifications` - List notifications
- `GET /api/notifications/unread` - Unread notifications
- `POST /api/notifications/read/:id` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Project Structure

```
backend/
├── config/                 # Configuration files
│   ├── db.js              # Database connection
│   ├── cloudinary.js      # Cloudinary setup
│   ├── logger.js          # Winston logger
│   └── production.js      # Production config
├── controllers/           # Route controllers
│   ├── authController.js   # Authentication logic
│   ├── fileController.js   # File operations
│   ├── userController.js   # User management
│   └── notificationController.js
├── middleware/            # Express middleware
│   ├── auth.js           # Authentication middleware
│   ├── errorHandler.js    # Error handling
│   └── activityLogger.js  # Activity logging
├── models/               # Database models
│   ├── User.js           # User schema
│   ├── File.js           # File schema
│   ├── Folder.js         # Folder schema
│   └── Notification.js   # Notification schema
├── routes/               # API routes
│   ├── authRoutes.js     # Auth endpoints
│   ├── fileRoutes.js     # File endpoints
│   ├── userRoutes.js     # User endpoints
│   └── adminRoutes.js    # Admin endpoints
├── services/            # Business logic services
│   ├── fileService.js    # File operations
│   ├── folderService.js  # Folder operations
│   ├── websocketService.js # WebSocket handling
│   └── notificationService.js
├── scripts/             # Utility scripts
│   ├── clearDatabase.js  # Clear database
│   ├── createTestUser.js # Create test user
│   └── fixCloudIds.js    # Fix Cloudinary IDs
├── utils/               # Helper utilities
│   ├── db.js            # Database helpers
│   └── validation.js    # Input validation
├── uploads/             # Local file uploads
├── index.js             # Server entry point
├── app.js               # Express app setup
└── package.json         # Dependencies and scripts
```

## WebSocket Events

The server supports WebSocket connections for real-time features:

- `file_uploaded` - New file uploaded
- `file_deleted` - File deleted
- `folder_created` - New folder created
- `user_connected` - User connected
- `user_disconnected` - User disconnected

## Security Features

- **Rate Limiting**: Prevents API abuse
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Sanitizes all inputs
- **JWT Authentication**: Secure token-based auth
- **Helmet**: Security headers
- **Activity Logging**: Tracks all user actions

## Monitoring & Logging

- **Winston Logger**: Structured logging with daily rotation
- **Activity Logs**: Tracks all user activities
- **System Metrics**: CPU, memory, and storage monitoring
- **Error Handling**: Centralized error processing

## Development Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm start               # Start server

# Database operations
npm run clear-db        # Clear database
npm run fix-cloudids    # Fix Cloudinary IDs
npm run check-cloudids  # Check Cloudinary IDs

# Testing
npm test                # Run tests
npm run lint            # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `CLOUDINARY_API_KEY` | Cloudinary API key | Yes |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `PORT` | Server port | No (default: 5001) |
| `NODE_ENV` | Environment | No (default: development) |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

## Deployment

### Vercel (Serverless)
```bash
npm install -g vercel
vercel --prod
```

### Traditional Server
```bash
# Build and start
npm install
npm start

# Or with PM2
pm2 start index.js --name cloudnest-server
```

### Docker
```bash
docker build -t cloudnest-server .
docker run -p 5001:5001 cloudnest-server
```

## Troubleshooting

1. **Database connection**: Check MongoDB URI and ensure MongoDB is running
2. **Cloudinary errors**: Verify Cloudinary credentials and cloud name
3. **Port conflicts**: Change PORT in .env or stop conflicting services
4. **CORS issues**: Update ALLOWED_ORIGINS in production
5. **File upload issues**: Check file size limits and Cloudinary settings

## API Documentation

For detailed API documentation, see the API endpoints section above or use tools like Postman to test the endpoints.
