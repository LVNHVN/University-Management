const { Router } = require('express');
const {
	handleListCurriculums,
	handleCreateCurriculum,
	handleGetCurriculumDetail,
	handleUpdateCurriculum,
	handleDeleteCurriculum,
} = require('../controllers/curriculum.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', handleListCurriculums);
router.post('/', handleCreateCurriculum);
router.get('/:id', handleGetCurriculumDetail);
router.put('/:id', handleUpdateCurriculum);
router.delete('/:id', handleDeleteCurriculum);

module.exports = router;