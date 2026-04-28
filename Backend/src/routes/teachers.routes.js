const { Router } = require('express');
const {
  handleListTeachers,
  handleGetTeacher,
  handleCreateTeacher,
  handleUpdateTeacher,
  handleDeleteTeacher,
  handleImportTeachersFromCsv,
  handlePreviewTeachersImport,
  handleCommitTeachersImport,
} = require('../controllers/teachers.controller');
const { handleGetTeacherAccount } = require('../controllers/accounts.controller');

const router = Router();

router.get('/', handleListTeachers);
router.get('/:id', handleGetTeacher);
router.post('/', handleCreateTeacher);
router.post('/import/csv', handleImportTeachersFromCsv);
router.post('/import/csv/preview', handlePreviewTeachersImport);
router.post('/import/csv/commit', handleCommitTeachersImport);
router.put('/:id', handleUpdateTeacher);
router.delete('/:id', handleDeleteTeacher);
router.get('/:id/account', handleGetTeacherAccount);

module.exports = router;
