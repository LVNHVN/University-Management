const Student = require('../../Models/Student');
const Teacher = require('../../Models/Teacher');
const User = require('../../Models/User');
const { buildStudentUsername, buildTeacherUsername, ensureAccountUsername } = require('../utils/username');
const { DEFAULT_ACCOUNT_PASSWORD } = require('../config/env');

const getStudentAccount = async (studentId) => {
  const student = await Student.findById(studentId).select('userId studentCode');

  if (!student) {
    const error = new Error('Không tìm thấy sinh viên.');
    error.status = 404;
    throw error;
  }

  const account = await ensureAccountUsername({
    userId: student.userId,
    expectedUsername: buildStudentUsername(student.studentCode),
  });

  return {
    userId: account._id,
    username: account.username,
    role: account.role,
    status: account.status,
  };
};

const getTeacherAccount = async (teacherId) => {
  const teacher = await Teacher.findById(teacherId).select('userId teacherCode');

  if (!teacher) {
    const error = new Error('Không tìm thấy giảng viên.');
    error.status = 404;
    throw error;
  }

  const account = await ensureAccountUsername({
    userId: teacher.userId,
    expectedUsername: buildTeacherUsername(teacher.teacherCode),
  });

  return {
    userId: account._id,
    username: account.username,
    role: account.role,
    status: account.status,
  };
};

const updateAccount = async (userId, { resetPassword, status }) => {
  const updateData = {};

  if (typeof status === 'boolean') {
    updateData.status = status;
  }

  if (resetPassword === true) {
    updateData.password = DEFAULT_ACCOUNT_PASSWORD;
  }

  const account = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('username role status');

  if (!account) {
    const error = new Error('Không tìm thấy tài khoản.');
    error.status = 404;
    throw error;
  }

  return {
    account: {
      userId: account._id,
      username: account.username,
      role: account.role,
      status: account.status,
    },
    message: resetPassword
      ? 'Đã đặt lại mật khẩu mặc định 123456.'
      : 'Đã cập nhật trạng thái tài khoản.',
  };
};

module.exports = { getStudentAccount, getTeacherAccount, updateAccount };
