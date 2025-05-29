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
// Define types for API endpoints to ensure type safety
export type ApiEndpoints = {
  AUTH: {
    LOGIN: string;
    REGISTER: string;
    LOGOUT: string;
    REFRESH: string;
    VERIFY: string;
    FORGOT_PASSWORD: string;
    RESET_PASSWORD: string;
  };
  FILES: {
    LIST: string;
    UPLOAD: string;
    DOWNLOAD: string;
    SHARE: string;
    STAR: string;
    RECENT: string;
    TRASH: string;
    EMPTY_TRASH: string;
    RESTORE: string;
    MOVE_TO_TRASH: string;
    DELETE: string;
    UPDATE: string; // Added UPDATE property to match implementation
  };
  FEEDBACK: {
    SUGGESTIONS: string;
    ADMIN_SUGGESTIONS: string;
  };
  ADMIN: {
    DASHBOARD: string;
    USERS: string;
    STORAGE_ANALYTICS: string;
    ACTIVITY_ANALYTICS: string;
    SYSTEM_HEALTH: string;
    SYSTEM_METRICS: string;
  };
  FOLDERS: {
    CREATE: string;
    DELETE: string;
    LIST: string;
  };
  SHARE_LINKS: string;
  DOCUMENTS: {
    UPLOAD: string;
    GET: string;
  };
  USERS: {
    PROFILE: string;
    AVATAR: string;
    STORAGE: string;
  };
  NOTIFICATIONS: {
    LIST: string;
    UNREAD: string;
    MARK_READ: string;
  };
};

export const API_ENDPOINTS: ApiEndpoints = {
  AUTH: {
    LOGIN: `${API_CONFIG.BASE_URL}/auth/login`,
    REGISTER: `${API_CONFIG.BASE_URL}/auth/register`,
    LOGOUT: `${API_CONFIG.BASE_URL}/auth/logout`,
    REFRESH: `${API_CONFIG.BASE_URL}/auth/refresh`,
    VERIFY: `${API_CONFIG.BASE_URL}/auth/verify`,
    FORGOT_PASSWORD: `${API_CONFIG.BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_CONFIG.BASE_URL}/auth/reset-password`,
  },
  FILES: {
    LIST: `${API_CONFIG.BASE_URL}/files`,
    UPLOAD: `${API_CONFIG.BASE_URL}/files/upload`,
    DOWNLOAD: `${API_CONFIG.BASE_URL}/files/download`,
    SHARE: `${API_CONFIG.BASE_URL}/files/share`,
    STAR: `${API_CONFIG.BASE_URL}/files/star`,
    RECENT: `${API_CONFIG.BASE_URL}/files/recent`,
    TRASH: `${API_CONFIG.BASE_URL}/files/trash`,
    EMPTY_TRASH: `${API_CONFIG.BASE_URL}/files/trash/empty`,
    RESTORE: `${API_CONFIG.BASE_URL}/files/restore`,
    MOVE_TO_TRASH: `${API_CONFIG.BASE_URL}/files/trash`, // Endpoint for moving files to trash
    DELETE: `${API_CONFIG.BASE_URL}/files`, // Endpoint for deleting files
    UPDATE: `${API_CONFIG.BASE_URL}/files` // Endpoint for updating files
  },
  FEEDBACK: {
    SUGGESTIONS: `${API_CONFIG.BASE_URL}/feedback/suggestions`,
    ADMIN_SUGGESTIONS: `${API_CONFIG.BASE_URL}/feedback/admin/suggestions`,
  },
  ADMIN: {
    DASHBOARD: `${API_CONFIG.BASE_URL}/admin/dashboard`,
    USERS: `${API_CONFIG.BASE_URL}/admin/users`,
    STORAGE_ANALYTICS: `${API_CONFIG.BASE_URL}/admin/analytics/storage`,
    ACTIVITY_ANALYTICS: `${API_CONFIG.BASE_URL}/admin/analytics/activity`,
    SYSTEM_HEALTH: `${API_CONFIG.BASE_URL}/admin/system/health`,
    SYSTEM_METRICS: `${API_CONFIG.BASE_URL}/admin/system/metrics`,
  },
  FOLDERS: {
    CREATE: `${API_CONFIG.BASE_URL}/folders`,
    DELETE: `${API_CONFIG.BASE_URL}/folders/delete`,
    LIST: `${API_CONFIG.BASE_URL}/folders`
  },
  SHARE_LINKS: `${API_CONFIG.BASE_URL}/share-links`,
  DOCUMENTS: {
    UPLOAD: `${API_CONFIG.BASE_URL}/documents/upload`,
    GET: `${API_CONFIG.BASE_URL}/documents`
  },
  USERS: {
    PROFILE: `${API_CONFIG.BASE_URL}/users/profile`,
    AVATAR: `${API_CONFIG.BASE_URL}/users/avatar`,
    STORAGE: `${API_CONFIG.BASE_URL}/users/storage`
  },
  NOTIFICATIONS: {
    LIST: `${API_CONFIG.BASE_URL}/notifications`,
    UNREAD: `${API_CONFIG.BASE_URL}/notifications/unread`,
    MARK_READ: `${API_CONFIG.BASE_URL}/notifications/read`
  }
};
