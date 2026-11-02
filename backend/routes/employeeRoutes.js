const express = require('express');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');
const { uploadPicture } = require('../middleware/upload');
const { list, create, getOne, update, remove, search, uploadPicture: savePicture } = require('../controllers/employeeController');
const {
  createRules,
  updateRules,
  idParamRules,
  idQueryRules,
  searchRules,
} = require('../validators/employeeValidators');

const router = express.Router();

// Every employee route requires a valid JWT
router.use(auth);

router.get('/employees', list);
router.post('/employees', createRules, validate, create);
// Declared before /:eid so "search" isn't treated as an employee id
router.get('/employees/search', searchRules, validate, search);
router.get('/employees/:eid', idParamRules, validate, getOne);
router.put('/employees/:eid', idParamRules, updateRules, validate, update);
router.post('/employees/:eid/picture', idParamRules, validate, uploadPicture, savePicture);
router.delete('/employees', idQueryRules, validate, remove);

module.exports = router;
