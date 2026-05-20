const { Router } = require('express');
const {
  handleListClasses,
  handleCreateClass,
  handleGetClassDetail,
  handleUpdateClass,
  handleDeleteClass,
  handleGetClassStudents,
  handleGetMySchedule,
} = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.get('/my/schedule', authenticate, authorize('student'), handleGetMySchedule);

router.use(authenticate, authorize('admin'));

router.get('/', handleListClasses);
router.post('/', handleCreateClass);
router.get('/:id', handleGetClassDetail);
router.get('/:id/students', handleGetClassStudents);
router.put('/:id', handleUpdateClass);
router.delete('/:id', handleDeleteClass);

module.exports = router;
