const { Router } = require('express');
const {
  handleListTeachers,
  handleGetTeacher,
  handleCreateTeacher,
  handleUpdateTeacher,
  handleDeleteTeacher,
} = require('../controllers/teachers.controller');
const { handleGetTeacherAccount } = require('../controllers/accounts.controller');

const router = Router();

router.get('/', handleListTeachers);
router.get('/:id', handleGetTeacher);
router.post('/', handleCreateTeacher);
router.put('/:id', handleUpdateTeacher);
router.delete('/:id', handleDeleteTeacher);
router.get('/:id/account', handleGetTeacherAccount);

module.exports = router;
