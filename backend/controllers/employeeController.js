const Employee = require('../models/Employee');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const logger = require('../utils/logger');
const { removeFile } = require('../middleware/upload');

// Only these fields may be set by the client. `user` is deliberately absent:
// the owner always comes from the authenticated token (req.user).
const FIELDS = ['first_name', 'last_name', 'email', 'position', 'salary', 'date_of_joining', 'department'];

const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

// Loads an employee and enforces ownership server-side.
async function loadOwned(eid, authUser) {
  const employee = await Employee.findById(eid);
  if (!employee) throw new AppError('Employee not found', 404);
  if (employee.user.toString() !== authUser.id) {
    logger.warn('Authorization failure: employee belongs to another user', {
      userId: authUser.id,
      employeeId: eid,
    });
    throw new AppError('Forbidden: this employee belongs to another user', 403);
  }
  return employee;
}

// GET /api/v1/emp/employees -> 200 (only the caller's employees)
exports.list = asyncHandler(async (req, res) => {
  const employees = await Employee.find({ user: req.user.id }).sort({ created_at: -1 });
  res.status(200).json(employees);
});

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/v1/emp/employees/search?department=&position=&q= -> 200
// Filters are always combined with the caller's id, so search can never leak other users' employees.
exports.search = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };
  const { department, position, q } = req.query;
  // Escaped + case-insensitive partial match; input is treated as text, never as a regex or operator
  if (department) filter.department = new RegExp(escapeRegex(department), 'i');
  if (position) filter.position = new RegExp(escapeRegex(position), 'i');
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ first_name: rx }, { last_name: rx }, { email: rx }];
  }
  const employees = await Employee.find(filter).sort({ created_at: -1 });
  res.status(200).json(employees);
});

// POST /api/v1/emp/employees/:eid/picture -> 200 (multipart/form-data, field "picture")
exports.uploadPicture = asyncHandler(async (req, res) => {
  try {
    if (!req.file) throw new AppError('No image uploaded (use field "picture")', 400);
    const employee = await loadOwned(req.params.eid, req.user);
    const old = employee.profile_picture;
    employee.profile_picture = req.file.filename;
    await employee.save();
    removeFile(old);
    logger.info('Employee picture updated', { userId: req.user.id, employeeId: employee.id });
    res.status(200).json({ message: 'Picture uploaded successfully', employee });
  } catch (err) {
    if (req.file) removeFile(req.file.filename); // don't keep orphaned files on failure
    throw err;
  }
});

// POST /api/v1/emp/employees -> 201
exports.create = asyncHandler(async (req, res) => {
  const employee = await Employee.create({ ...pick(req.body), user: req.user.id });
  logger.info('Employee created', { userId: req.user.id, employeeId: employee.id });
  res.status(201).json({ message: 'Employee created successfully', employee });
});

// GET /api/v1/emp/employees/:eid -> 200
exports.getOne = asyncHandler(async (req, res) => {
  const employee = await loadOwned(req.params.eid, req.user);
  res.status(200).json(employee);
});

// PUT /api/v1/emp/employees/:eid -> 200
exports.update = asyncHandler(async (req, res) => {
  const employee = await loadOwned(req.params.eid, req.user);
  employee.set(pick(req.body));
  await employee.save();
  logger.info('Employee updated', { userId: req.user.id, employeeId: employee.id });
  res.status(200).json({ message: 'Employee updated successfully', employee });
});

// DELETE /api/v1/emp/employees?eid=xxx -> 204
exports.remove = asyncHandler(async (req, res) => {
  const employee = await loadOwned(req.query.eid, req.user);
  await employee.deleteOne();
  removeFile(employee.profile_picture);
  logger.info('Employee deleted', { userId: req.user.id, employeeId: req.query.eid });
  res.status(204).send();
});
