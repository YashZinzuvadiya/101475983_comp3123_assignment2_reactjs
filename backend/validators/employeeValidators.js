const { body, param, query } = require('express-validator');

const str = (field, max = 100) =>
  body(field).isString().withMessage(`${field} is required`).trim()
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ max }).withMessage(`${field} must be at most ${max} characters`);

const rules = (optional) => {
  const wrap = (chain) => (optional ? chain.optional() : chain);
  return [
    wrap(str('first_name', 50)),
    wrap(str('last_name', 50)),
    wrap(str('email', 254).isEmail().withMessage('email must be a valid email address')),
    wrap(str('position')),
    wrap(
      body('salary')
        .isFloat({ gt: 0 }).withMessage('salary must be a number greater than 0')
        .toFloat()
    ),
    wrap(body('date_of_joining').isISO8601().withMessage('date_of_joining must be a valid date (YYYY-MM-DD)')),
    wrap(str('department')),
  ];
};

exports.createRules = rules(false);
exports.updateRules = rules(true);

exports.searchRules = ['department', 'position', 'q'].map((f) =>
  query(f).optional().isString().withMessage(`${f} must be text`).trim().isLength({ max: 100 }).withMessage(`${f} is too long`)
);

exports.idParamRules = [param('eid').isMongoId().withMessage('eid must be a valid employee id')];
exports.idQueryRules = [query('eid').isMongoId().withMessage('eid query parameter must be a valid employee id')];
