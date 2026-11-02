const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

exports.notFound = (req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Centralized error handler: every error leaves the API as consistent JSON
// eslint-disable-next-line no-unused-vars
exports.errorHandler = (err, req, res, _next) => {
  let status = err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON in request body';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid value for ${err.path}`;
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Duplicate value: resource already exists';
  } else if (!err.isOperational && status === 500) {
    message = 'Internal server error'; // hide internals (DB details, stack traces)
  }

  if (status >= 500) {
    logger.error('Unhandled error', { method: req.method, path: req.originalUrl, message: err.message });
  }

  const body = { status: 'error', message };
  if (status === 500 && process.env.NODE_ENV === 'development') body.stack = err.stack;
  res.status(status).json(body);
};
