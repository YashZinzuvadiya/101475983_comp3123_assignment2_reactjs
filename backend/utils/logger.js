const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Vercel's filesystem is read-only, so there it logs to stdout (Vercel's log viewer) only
const FILE_LOGGING = !process.env.VERCEL;
if (FILE_LOGGING) fs.mkdirSync(LOG_DIR, { recursive: true });

// Keys that must never reach the log file.
const SENSITIVE = ['password', 'token', 'authorization', 'secret', 'jwt'];

function scrub(meta) {
  const out = {};
  for (const [k, v] of Object.entries(meta || {})) {
    out[k] = SENSITIVE.some((s) => k.toLowerCase().includes(s)) ? '[REDACTED]' : v;
  }
  return out;
}

function write(level, message, meta) {
  const line =
    JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...scrub(meta) }) + '\n';
  if (FILE_LOGGING) fs.appendFile(LOG_FILE, line, () => {});
  if (process.env.NODE_ENV !== 'test') process.stdout.write(line);
}

module.exports = {
  info: (m, meta) => write('INFO', m, meta),
  warn: (m, meta) => write('WARN', m, meta),
  error: (m, meta) => write('ERROR', m, meta),
};
