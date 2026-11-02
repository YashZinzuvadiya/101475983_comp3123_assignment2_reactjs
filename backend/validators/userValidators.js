const { body } = require('express-validator');

exports.signupRules = [
  body('username')
    .isString().withMessage('username is required')
    .trim()
    .isLength({ min: 3, max: 30 }).withMessage('username must be 3-30 characters'),
  body('email')
    .isString().withMessage('email is required')
    .trim()
    .isLength({ max: 254 }).withMessage('email is too long')
    .isEmail().withMessage('email must be a valid email address'),
  body('password')
    .isString().withMessage('password is required')
    .isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters')
    .matches(/[a-z]/).withMessage('password must contain a lowercase letter')
    .matches(/[A-Z]/).withMessage('password must contain an uppercase letter')
    .matches(/\d/).withMessage('password must contain a number'),
];

exports.loginRules = [
  body().custom((value) => {
    if (!value || (!value.username && !value.email)) throw new Error('username or email is required');
    return true;
  }),
  body('username').optional().isString().withMessage('username must be a string').trim(),
  body('email').optional().isEmail().withMessage('email must be a valid email address'),
  body('password').isString().notEmpty().withMessage('password is required'),
];
