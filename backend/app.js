const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

const requestLogger = require('./middleware/requestLogger');
const { apiLimiter } = require('./middleware/rateLimiter');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');

const app = express();

// Browsers block cross-origin calls unless the API opts in. Only the configured frontend origin(s) are allowed.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Helmet's default CORP header would stop the frontend (another origin) from displaying uploaded images
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['RateLimit-Reset', 'Retry-After'],
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

// Uploaded profile pictures (public read; filenames are random and unguessable)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { index: false, fallthrough: true }));

app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'COMP 3123 Assignment 2 - Employee REST API',
    status: 'running',
    health: '/health',
    endpoints: {
      signup: 'POST /api/v1/user/signup',
      login: 'POST /api/v1/user/login',
      employees: 'GET|POST /api/v1/emp/employees',
      employee: 'GET|PUT /api/v1/emp/employees/{eid}',
      search: 'GET /api/v1/emp/employees/search?department=&position=&q=',
      picture: 'POST /api/v1/emp/employees/{eid}/picture (multipart, field "picture")',
      delete: 'DELETE /api/v1/emp/employees?eid=xxx',
    },
  });
});
app.use('/health', healthRoutes);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/emp', employeeRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
