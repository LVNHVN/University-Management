const { Router } = require('express');
const {
  handleListClasses,
  handleCreateClass,
  handleGetClassDetail,
  handleUpdateClass,
  handleDeleteClass,
  handleGetClassStudents,
  handleGetMySchedule,
  handleGetMyGrades,
  handleGetMyGradeSummary,
  handleUpdateStudentGrades,
  handleImportClassGrades,
  handleGetClassAttendance,
  handleUpdateClassAttendance,
} = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.get('/my/schedule', authenticate, authorize('student', 'teacher'), handleGetMySchedule);
router.get('/my/grades', authenticate, authorize('student'), handleGetMyGrades);
router.get('/my/grades-summary', authenticate, authorize('student'), handleGetMyGradeSummary);
router.get('/:id/students', authenticate, authorize('teacher', 'admin'), handleGetClassStudents);
router.patch('/:id/students/:enrollmentId/grades', authenticate, authorize('teacher', 'admin'), handleUpdateStudentGrades);
router.post('/:id/students/grades/import', authenticate, authorize('teacher', 'admin'), handleImportClassGrades);
router.get('/:id/attendance', authenticate, authorize('teacher', 'admin'), handleGetClassAttendance);
router.patch('/:id/attendance', authenticate, authorize('teacher', 'admin'), handleUpdateClassAttendance);

router.use(authenticate, authorize('admin'));

router.get('/', handleListClasses);
router.post('/', handleCreateClass);
router.get('/:id', handleGetClassDetail);
router.put('/:id', handleUpdateClass);
router.delete('/:id', handleDeleteClass);

module.exports = router;
