const { Router } = require('express');
const {
  handleListSemesters,
  handleGetSemesterDetail,
  handleCreateSemester,
  handleUpdateSemester,
} = require('../controllers/semester.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', handleListSemesters);
router.post('/', handleCreateSemester);
router.get('/:id', handleGetSemesterDetail);
router.put('/:id', handleUpdateSemester);

module.exports = router;
