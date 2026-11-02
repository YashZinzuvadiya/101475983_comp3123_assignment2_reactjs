const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Extension comes from the validated MIME type, never from the client-supplied filename
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };
const MAX_BYTES = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXT[file.mimetype]),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) =>
    EXT[file.mimetype] ? cb(null, true) : cb(new AppError('Only JPEG, PNG, WEBP or GIF images are allowed', 400)),
});

// Wraps multer so its errors become consistent 400s
exports.uploadPicture = (req, res, next) =>
  upload.single('picture')(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') return next(new AppError('Image must be 2 MB or smaller', 400));
    if (err instanceof multer.MulterError) return next(new AppError(err.message, 400));
    next(err);
  });

exports.removeFile = (filename) => {
  if (!filename) return;
  fs.unlink(path.join(UPLOAD_DIR, path.basename(filename)), () => {});
};
