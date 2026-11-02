const mongoose = require('mongoose');
const logger = require('../utils/logger');

const DB_NAME = 'comp3123_assignment2';

let connecting;

// Safe to call repeatedly (serverless invocations reuse the same connection)
async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');
  }
  if (!connecting) {
    connecting = mongoose.connect(uri, { dbName: DB_NAME }).catch((err) => {
      connecting = undefined;
      throw err;
    });
  }
  await connecting;
  logger.info('MongoDB connected', { database: DB_NAME });
}

module.exports = connectDB;
