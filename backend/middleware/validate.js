const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Runs after express-validator chains; turns failures into a 400 JSON response
module.exports = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  logger.warn('Validation failed', {
    method: req.method,
    path: req.originalUrl,
    fields: errors.map((e) => e.field).join(','),
  });
  res.status(400).json({ status: 'error', message: 'Validation failed', errors });
};
