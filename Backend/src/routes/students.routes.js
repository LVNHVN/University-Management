const { Router } = require('express');
const {
  handleListStudents,
  handleGetStudent,
  handleCreateStudent,
  handleUpdateStudent,
  handleDeleteStudent,
} = require('../controllers/students.controller');
const { handleGetStudentAccount } = require('../controllers/accounts.controller');

const router = Router();

router.get('/', handleListStudents);
router.get('/:id', handleGetStudent);
router.post('/', handleCreateStudent);
router.put('/:id', handleUpdateStudent);
router.delete('/:id', handleDeleteStudent);
router.get('/:id/account', handleGetStudentAccount);

module.exports = router;
