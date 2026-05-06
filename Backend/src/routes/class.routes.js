const { Router } = require('express');
const {
  handleListClasses,
  handleCreateClass,
  handleGetClassDetail,
  handleUpdateClass,
  handleDeleteClass,
} = require('../controllers/class.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/', handleListClasses);
router.post('/', handleCreateClass);
router.get('/:id', handleGetClassDetail);
router.put('/:id', handleUpdateClass);
router.delete('/:id', handleDeleteClass);

module.exports = router;
