const buildStudentUsername = (studentCode) => `SV_${String(studentCode || '').trim()}`;
const buildTeacherUsername = (teacherCode) => `GV_${String(teacherCode || '').trim()}`;

const User = require('../../Models/User');

const ensureAccountUsername = async ({ userId, expectedUsername }) => {
  const account = await User.findById(userId).select('username role status');

  if (!account) {
    const error = new Error('Không tìm thấy tài khoản.');
    error.status = 404;
    throw error;
  }

  if (account.username === expectedUsername) {
    return account;
  }

  const usernameExists = await User.findOne({
    username: expectedUsername,
    _id: { $ne: userId },
  }).select('_id').lean();

  if (usernameExists) {
    const error = new Error('Tên tài khoản chuẩn đã tồn tại ở tài khoản khác.');
    error.status = 409;
    throw error;
  }

  account.username = expectedUsername;
  await account.save();
  return account;
};

module.exports = { buildStudentUsername, buildTeacherUsername, ensureAccountUsername };
