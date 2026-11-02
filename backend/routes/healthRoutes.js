const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

router.get('/', (_req, res) => {
  const dbState = STATES[mongoose.connection.readyState] || 'unknown';
  res.status(200).json({
    status: 'ok',
    uptime_seconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: dbState,
  });
});

module.exports = router;
