const { Router } = require('express');
const {
	handleGetMyTuition,
	handleCreateMyTuitionQr,
	handleListTuitionsForAdmin,
	handleGetStudentTuitionHistoryForAdmin,
	handleConfirmTuitionByAdmin,
} = require('../controllers/tuition.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.get('/my', authenticate, authorize('student'), handleGetMyTuition);
router.post('/my/qr', authenticate, authorize('student'), handleCreateMyTuitionQr);

router.use(authenticate, authorize('admin'));
router.get('/', handleListTuitionsForAdmin);
router.get('/:id/history', handleGetStudentTuitionHistoryForAdmin);
router.patch('/:id/confirm', handleConfirmTuitionByAdmin);

module.exports = router;
