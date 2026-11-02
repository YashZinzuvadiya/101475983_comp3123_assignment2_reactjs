const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

// Verifies "Authorization: Bearer <jwt>" and attaches the user to req.user.
// Ownership of resources is always derived from req.user, never from client input.
module.exports = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    logger.warn('Auth failed: missing token', { path: req.originalUrl });
    throw new AppError('Authentication required: missing Bearer token', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    const expired = err.name === 'TokenExpiredError';
    logger.warn(`Auth failed: ${expired ? 'expired' : 'invalid'} token`, { path: req.originalUrl });
    throw new AppError(expired ? 'Token expired' : 'Invalid token', 401);
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    logger.warn('Auth failed: token user no longer exists', { path: req.originalUrl });
    throw new AppError('Invalid token', 401);
  }

  req.user = user;
  next();
});
