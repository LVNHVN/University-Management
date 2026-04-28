const { Router } = require('express');
const {
  handleListStudents,
  handleGetStudent,
  handleCreateStudent,
  handleUpdateStudent,
  handleDeleteStudent,
  handleImportStudentsFromCsv,
  handlePreviewStudentsImport,
  handleCommitStudentsImport,
} = require('../controllers/students.controller');
const { handleGetStudentAccount } = require('../controllers/accounts.controller');

const router = Router();

router.get('/', handleListStudents);
router.get('/:id', handleGetStudent);
router.post('/', handleCreateStudent);
router.post('/import/csv', handleImportStudentsFromCsv);
router.post('/import/csv/preview', handlePreviewStudentsImport);
router.post('/import/csv/commit', handleCommitStudentsImport);
router.put('/:id', handleUpdateStudent);
router.delete('/:id', handleDeleteStudent);
router.get('/:id/account', handleGetStudentAccount);

module.exports = router;
