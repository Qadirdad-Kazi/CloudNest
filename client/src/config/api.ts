// Check if required environment variables are set
const checkRequiredEnvVars = () => {
  const requiredVars = [
    'VITE_API_URL',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_API_KEY',
    'VITE_CLOUDINARY_UPLOAD_URL'
  ];
  
  const missingVars = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`WARNING: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Some features may not work correctly. Please check your .env file.');
  }
};

// Call the check function
checkRequiredEnvVars();

// API configuration using only environment variables
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL,
  CLOUDINARY: {
    CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
    UPLOAD_URL: import.meta.env.VITE_CLOUDINARY_UPLOAD_URL
  },
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000'), // 30 seconds default
  IS_PRODUCTION: import.meta.env.VITE_NODE_ENV === 'production'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh'
  },
  FILES: {
    LIST: '/files',
    UPLOAD: '/files/upload',
    DELETE: '/files/delete',
    STAR: '/files/star',
    SHARE: '/files/share',
    RECENT: '/files/recent',
    TRASH: '/files/trash',
    RESTORE: '/files/restore',
    EMPTY_TRASH: '/files/trash/empty'
  },
  FOLDERS: {
    CREATE: '/folders',
    DELETE: '/folders/delete',
    LIST: '/folders'
  },
  SHARE_LINKS: '/share-links',
  DOCUMENTS: {
    UPLOAD: '/documents/upload',
    GET: '/documents'
  },
  USERS: {
    PROFILE: '/users/profile',
    AVATAR: '/users/avatar'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD: '/notifications/unread',
    MARK_READ: '/notifications/read'
  }
};
