const { Router } = require('express');
const { uploadSubjectSyllabus, handleListSubjects, handleGetSubject, handleCreateSubject, handleUpdateSubject, handleDeleteSubject } = require('../controllers/subjects.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', handleListSubjects);
router.post('/', uploadSubjectSyllabus, handleCreateSubject);
router.get('/:id', handleGetSubject);
router.put('/:id', uploadSubjectSyllabus, handleUpdateSubject);
router.delete('/:id', handleDeleteSubject);

module.exports = router;
