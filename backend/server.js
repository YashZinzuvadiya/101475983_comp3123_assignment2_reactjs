require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  if (!process.env.JWT_SECRET) {
    logger.error('JWT_SECRET is not set');
    process.exit(1);
  }
  try {
    await connectDB();
    app.listen(PORT, () => logger.info(`Server listening on port ${PORT}`));
  } catch (err) {
    logger.error('Failed to start server', { message: err.message });
    process.exit(1);
  }
}

start();
