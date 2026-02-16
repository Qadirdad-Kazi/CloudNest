/// API configuration for CloudNest Flutter app
/// Uses app_server (separate backend for mobile) - default port 5002
/// - Android emulator: use http://10.0.2.2:5002/api
/// - iOS simulator / web: use http://localhost:5002/api
/// - Physical device: use http://YOUR_IP:5002/api
class ApiConfig {
  static const String baseUrl = 'http://localhost:5002/api';
  // Use http://localhost:5001/api for iOS simulator or web
  // Use your actual server IP for physical device: http://192.168.x.x:5001/api

  static String get apiUrl {
    // You can override via environment or platform
    return baseUrl;
  }

  static const Duration timeout = Duration(seconds: 30);

  // Auth endpoints
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';

  // Files endpoints
  static const String files = '/files';
  static const String filesUpload = '/files/upload';
  static const String filesTrash = '/files/trash';
  static const String filesRestore = '/files/restore';
  static const String filesStarred = '/files/starred';
  static const String filesStar = '/files/star';
  static const String filesUpdate = '/files/update';
  static const String filesRecent = '/files/recent';
  static const String filesEmptyTrash = '/files/trash/empty';

  // Folders endpoints
  static const String folders = '/folders';
  static const String foldersCreate = '/folders/create';
  static const String foldersDelete = '/folders/delete';
  static const String foldersStar = '/folders';
  static const String foldersTrash = '/folders/trash';
  static const String foldersRename = '/folders';

  // Shares endpoints - server uses POST / for create, DELETE /:id for delete
  static const String shares = '/shares';

  // Users endpoints
  static const String usersProfile = '/users/profile';
  static const String usersSettings = '/users/settings';
  static const String usersStorage = '/users/storage';
  static const String usersAvatar = '/users/avatar';

  // Notifications
  static const String notifications = '/notifications';

  // Feedback
  static const String feedbackSuggestions = '/feedback/suggestions';
}
