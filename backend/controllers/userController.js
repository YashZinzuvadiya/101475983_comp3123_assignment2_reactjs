const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');

const SALT_ROUNDS = 10;

// POST /api/v1/user/signup  -> 201
exports.signup = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existing = await User.findOne({
    $or: [{ username }, { email: email.toLowerCase() }],
  });
  if (existing) {
    logger.warn('Signup rejected: user already exists', { ip: req.ip });
    throw new AppError('User with that username or email already exists', 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, email, password: hashed });

  logger.info('User signed up', { userId: user.id });
  res.status(201).json({ message: 'User created successfully', user });
});

// POST /api/v1/user/login  -> 200 (accepts username OR email)
exports.login = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const query = username ? { username } : { email: email.toLowerCase() };
  const user = await User.findOne(query).select('+password');

  // Same message for unknown user and wrong password so accounts can't be enumerated
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) {
    logger.warn('Login failed: invalid credentials', { ip: req.ip });
    throw new AppError('Invalid credentials', 401);
  }

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });

  logger.info('User logged in', { userId: user.id });
  res.status(200).json({ message: 'Login successful', token, user });
});
