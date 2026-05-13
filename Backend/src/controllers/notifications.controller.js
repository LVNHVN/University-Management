const {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
} = require('../services/notifications.service');

const handleCreateNotification = async (req, res, next) => {
  const { title, content, targetRoles } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung thông báo.' });
  }

  if (!Array.isArray(targetRoles)) {
    return res.status(400).json({ success: false, message: 'Đối tượng nhận thông báo không hợp lệ.' });
  }

  try {
    const notification = await createNotification({
      title: String(title).trim(),
      content: String(content).trim(),
      targetRoles,
      createdBy: req.user.id,
    });
    return res.status(201).json({ success: true, notification });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleGetMyNotifications = async (req, res, next) => {
  try {
    const payload = await getNotificationsForUser({ userId: req.user.id, role: req.user.role });
    return res.json({ success: true, ...payload });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleMarkNotificationRead = async (req, res, next) => {
  try {
    await markNotificationAsRead({
      notificationId: req.params.id,
      userId: req.user.id,
      role: req.user.role,
    });
    return res.json({ success: true });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = {
  handleCreateNotification,
  handleGetMyNotifications,
  handleMarkNotificationRead,
};
