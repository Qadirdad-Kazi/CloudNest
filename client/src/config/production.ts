export const productionConfig = {
  // API configuration
  api: {
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  },

  // Cloudinary configuration
  cloudinary: {
    cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY
  },

  // File upload configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    acceptedFileTypes: [
      'image/*',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv'
    ],
    maxConcurrentUploads: 3
  },

  // Cache configuration
  cache: {
    maxAge: 3600, // 1 hour
    staleWhileRevalidate: 7200 // 2 hours
  },

  // Error tracking configuration
  errorTracking: {
    enabled: true,
    sampleRate: 0.1, // 10% of errors
    ignoreErrors: [
      'Network Error',
      'AbortError',
      'ResizeObserver loop limit exceeded'
    ]
  },

  // Performance monitoring
  performance: {
    enabled: true,
    maxMeasurements: 100,
    navigationTiming: true,
    resourceTiming: true,
    longTaskMonitoring: true
  },

  // Authentication configuration
  auth: {
    tokenRefreshInterval: 15 * 60 * 1000, // 15 minutes
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // UI configuration
  ui: {
    theme: 'system',
    animationsEnabled: true,
    toastDuration: 3000,
    maxRecentFiles: 10,
    maxSearchResults: 50,
    defaultPageSize: 20
  }
}; 