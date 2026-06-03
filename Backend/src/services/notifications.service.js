const mongoose = require('mongoose');
const Notification = require('../../Models/Notification');

const mapTargetRolesToValue = (targetRoles = []) => {
  const normalized = Array.from(new Set(targetRoles.filter((role) => role === 'teacher' || role === 'student')));

  if (normalized.length === 2) {
    return 'all';
  }

  if (normalized.length === 1) {
    return normalized[0];
  }

  return '';
};

const createNotification = async ({ title, content, targetRoles, createdBy, recipientUserId }) => {
  const targetRole = mapTargetRolesToValue(targetRoles);

  if (!targetRole && !recipientUserId) {
    const error = new Error('Vui lòng chọn ít nhất một đối tượng nhận thông báo.');
    error.status = 400;
    throw error;
  }

  const notification = await Notification.create({
    title,
    content,
    targetRole: targetRole || 'student',
    createdBy,
    ...(recipientUserId ? { recipientUserId } : {}),
    readBy: [],
  });

  return {
    _id: notification._id,
    title: notification.title,
    content: notification.content,
    targetRole: notification.targetRole,
    createdAt: notification.createdAt,
  };
};

const getNotificationsForUser = async ({ userId, role }) => {
  const isTargetRole = role === 'teacher' || role === 'student';

  if (!isTargetRole) {
    return { unreadCount: 0, notifications: [] };
  }

  const notifications = await Notification.find({
    $or: [
      { recipientUserId: userId },
      {
        recipientUserId: { $exists: false },
        targetRole: { $in: ['all', role] },
      },
    ],
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(100)
    .lean();

  const normalized = notifications.map((item) => {
    const hasRead = Array.isArray(item.readBy)
      ? item.readBy.some((readerId) => String(readerId) === String(userId))
      : false;

    return {
      _id: item._id,
      title: item.title,
      content: item.content,
      targetRole: item.targetRole,
      createdAt: item.createdAt,
      isRead: hasRead,
      isNew: !hasRead,
    };
  });

  return {
    unreadCount: normalized.filter((item) => item.isNew).length,
    notifications: normalized,
  };
};

const markNotificationAsRead = async ({ notificationId, userId, role }) => {
  if (!mongoose.isValidObjectId(notificationId)) {
    const error = new Error('ID thông báo không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const isTargetRole = role === 'teacher' || role === 'student';

  if (!isTargetRole) {
    const error = new Error('Không có quyền truy cập.');
    error.status = 403;
    throw error;
  }

  const notification = await Notification.findOneAndUpdate(
    {
      _id: notificationId,
      targetRole: { $in: ['all', role] },
    },
    {
      $addToSet: { readBy: userId },
    },
    { returnDocument: 'after' },
  ).lean();

  if (!notification) {
    const error = new Error('Không tìm thấy thông báo.');
    error.status = 404;
    throw error;
  }

  return { success: true };
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
};
