const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const num = (v, d) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);

const build = (max, windowMin, label) =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded (${label})`, { ip: req.ip, path: req.originalUrl });
      res.status(429).json({ status: 'error', message: 'Too many requests, please try again later' });
    },
  });

// Strict limiter for brute-force-prone endpoints (signup, login)
exports.authLimiter = build(
  num(process.env.AUTH_RATE_LIMIT_MAX, 5),
  num(process.env.AUTH_RATE_LIMIT_WINDOW_MIN, 15),
  'auth'
);

// Looser limiter for all other API traffic
exports.apiLimiter = build(
  num(process.env.API_RATE_LIMIT_MAX, 100),
  num(process.env.API_RATE_LIMIT_WINDOW_MIN, 15),
  'api'
);
