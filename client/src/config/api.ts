// Check if required environment variables are set
const checkRequiredEnvVars = () => {
  const requiredVars = [
    'VITE_API_URL',
    'VITE_CLOUDINARY_CLOUD_NAME',
    'VITE_CLOUDINARY_API_KEY'
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
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:5001',
  CLOUDINARY: {
    CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY,
    UPLOAD_URL: `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'cloudnest'
  },
  TIMEOUT: 120000 // 2 minutes
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
    UPDATE: string;
    MONGODB: {
      DELETE: string;
      UPLOAD: string;
      GET: string;
    };
    CLOUDINARY: {
      DELETE: string;
    };
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
    UPDATE: string;
    STAR: string;
    TRASH: string;
    RESTORE: string;
  };
  SHARES: {
    LIST: string;
    CREATE: string;
    DELETE: string;
    UPDATE: string;
  };
  USERS: {
    PROFILE: string;
    SETTINGS: string;
    AVATAR: string;
    STORAGE: string;
  };
  NOTIFICATIONS: {
    LIST: string;
    UNREAD: string;
    MARK_READ: string;
    DELETE: string;
  };
};

export const API_ENDPOINTS: ApiEndpoints = {
  AUTH: {
    LOGIN: `/auth/login`,
    REGISTER: `/auth/register`,
    LOGOUT: `/auth/logout`,
    REFRESH: `/auth/refresh`,
    VERIFY: `/auth/me`,
    FORGOT_PASSWORD: `/auth/forgot-password`,
    RESET_PASSWORD: `/auth/reset-password`
  },
  FILES: {
    LIST: `/files`,
    UPLOAD: `/files/upload`,
    DOWNLOAD: `/files/download`,
    DELETE: `/files/delete`,
    MOVE_TO_TRASH: `/files/trash`,
    RESTORE: `/files/restore`,
    EMPTY_TRASH: `/files/trash/empty`,
    STAR: `/files/star`,
    SHARE: `/files/share`,
    UPDATE: `/files/update`,
    RECENT: `/files/recent`,
    TRASH: `/files/trash`,
    MONGODB: {
      DELETE: `/files/mongodb/delete`,
      UPLOAD: `/files/mongodb/upload`,
      GET: `/files/mongodb/get`
    },
    CLOUDINARY: {
      DELETE: `/files/cloudinary/delete`
    }
  },
  FEEDBACK: {
    SUGGESTIONS: `/feedback/suggestions`,
    ADMIN_SUGGESTIONS: `/feedback/admin/suggestions`,
  },
  ADMIN: {
    DASHBOARD: `/admin/dashboard`,
    USERS: `/admin/users`,
    STORAGE_ANALYTICS: `/admin/analytics/storage`,
    ACTIVITY_ANALYTICS: `/admin/analytics/activity`,
    SYSTEM_HEALTH: `/admin/system/health`,
    SYSTEM_METRICS: `/admin/system/metrics`,
  },
  FOLDERS: {
    CREATE: `/folders/create`,
    DELETE: `/folders/delete`,
    LIST: `/folders`,
    UPDATE: `/folders/update`,
    STAR: `/folders/star`,
    TRASH: `/folders/trash`,
    RESTORE: `/folders/restore`
  },
  SHARES: {
    LIST: `/shares`,
    CREATE: `/shares/create`,
    DELETE: `/shares/delete`,
    UPDATE: `/shares/update`
  },
  USERS: {
    PROFILE: `/users/profile`,
    SETTINGS: `/users/settings`,
    AVATAR: `/users/avatar`,
    STORAGE: `/users/storage`
  },
  NOTIFICATIONS: {
    LIST: `/notifications`,
    UNREAD: `/notifications/unread`,
    MARK_READ: `/notifications/read`,
    DELETE: `/notifications`
  }
};