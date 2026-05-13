const { Router } = require('express');
const { authenticate, authorize } = require('../middleware/authenticate');
const {
  handleCreateNotification,
  handleGetMyNotifications,
  handleMarkNotificationRead,
} = require('../controllers/notifications.controller');

const router = Router();

router.use(authenticate);

router.post('/', authorize('admin'), handleCreateNotification);
router.get('/me', authorize('teacher', 'student'), handleGetMyNotifications);
router.post('/:id/read', authorize('teacher', 'student'), handleMarkNotificationRead);

module.exports = router;
