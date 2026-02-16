import winston from 'winston';

// Configure winston logger
const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Custom error class for API errors
export class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    user: req.user ? req.user.id : null
  });

  // Default error
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle different types of errors
  if (err instanceof APIError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    details = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
  } else if (err.name === 'CastError') {
    // Mongoose cast error
    statusCode = 400;
    message = 'Invalid ID format';
    details = { field: err.path };
  } else if (err.name === 'MongoServerError' && err.code === 11000) {
    // Duplicate key error
    statusCode = 409;
    message = 'Duplicate Entry';
    details = { field: Object.keys(err.keyPattern)[0] };
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration error
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'MulterError') {
    // File upload error
    statusCode = 400;
    message = 'File upload error';
    details = { field: err.field };
  }

  // Handle development vs production error response
  const response = {
    success: false,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Send error response
  res.status(statusCode).json(response);
};

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new APIError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// Async handler wrapper
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Rate limit error handler
export const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.'
  });
};

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body, { abortEarly: false });
      if (error) {
        const details = error.details.map(detail => ({
          field: detail.path[0],
          message: detail.message
        }));
        throw new APIError('Validation Error', 400, details);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}; 