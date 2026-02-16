import ActivityLog from '../models/ActivityLog.js';

/**
 * Middleware to log user activity
 * @param {string} action - The action being performed
 * @param {string} resourceType - The type of resource being acted upon
 * @returns {Function} Express middleware
 */
export const logActivity = (action, resourceType) => {
  return async (req, res, next) => {
    // Store the original end method
    const originalEnd = res.end;
    
    // Override the end method
    res.end = async function(chunk, encoding) {
      // Call the original end method
      originalEnd.call(this, chunk, encoding);
      
      try {
        // Only log if authenticated and successful (2xx status code)
        if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
          const activityLog = new ActivityLog({
            userId: req.user._id,
            action,
            resourceType,
            resourceId: req.params.id || null,
            details: getActionDetails(action, req),
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          });
          
          await activityLog.save();
        }
      } catch (error) {
        console.error('Error logging activity:', error);
      }
    };
    
    next();
  };
};

/**
 * Get detailed description of the action
 * @param {string} action - The action being performed
 * @param {Object} req - Express request object
 * @returns {string} Detailed description
 */
const getActionDetails = (action, req) => {
  switch (action) {
    case 'login':
      return `User logged in`;
    case 'logout':
      return `User logged out`;
    case 'upload':
      return `Uploaded file: ${req.file?.originalname || 'Unknown'}`;
    case 'download':
      return `Downloaded file with ID: ${req.params.id || 'Unknown'}`;
    case 'delete':
      return `Deleted ${resourceType} with ID: ${req.params.id || 'Unknown'}`;
    case 'share':
      return `Shared ${resourceType} with ID: ${req.params.id || 'Unknown'}`;
    case 'create_folder':
      return `Created folder: ${req.body.name || 'Unknown'}`;
    case 'move':
      return `Moved ${resourceType} with ID: ${req.params.id || 'Unknown'}`;
    case 'rename':
      return `Renamed ${resourceType} with ID: ${req.params.id || 'Unknown'} to ${req.body.name || 'Unknown'}`;
    case 'restore':
      return `Restored ${resourceType} with ID: ${req.params.id || 'Unknown'} from trash`;
    default:
      return `Performed ${action} on ${resourceType}`;
  }
};

/**
 * Log errors that occur during request processing
 */
export const errorLogger = async (err, req, res, next) => {
  try {
    if (req.user) {
      const activityLog = new ActivityLog({
        userId: req.user._id,
        action: 'error',
        resourceType: 'system',
        details: `Error: ${err.message || 'Unknown error'}`,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      await activityLog.save();
    }
  } catch (logError) {
    console.error('Error logging error activity:', logError);
  }
  
  next(err);
};

export default { logActivity, errorLogger };
