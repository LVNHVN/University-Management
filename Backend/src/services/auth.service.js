const { RECAPTCHA_SECRET_KEY, JWT_SECRET } = require('../config/env');
const User = require('../../Models/User');
const Student = require('../../Models/Student');
const Teacher = require('../../Models/Teacher');
const RevokedToken = require('../../Models/RevokedToken');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');

const getFullName = async (userId, role) => {
  if (role === 'student') {
    const student = await Student.findOne({ userId }).select('fullName').lean();
    return student?.fullName || '';
  }
  if (role === 'teacher') {
    const teacher = await Teacher.findOne({ userId }).select('fullName').lean();
    return teacher?.fullName || '';
  }
  return '';
};

const getProfile = async (userId, role) => {
  if (role === 'student') {
    const student = await Student.findOne({ userId })
      .select('studentCode fullName dob gender nationalIdNumber phone address major academicYear')
      .lean();
    return student ? { ...student, role } : null;
  }
  if (role === 'teacher') {
    const teacher = await Teacher.findOne({ userId })
      .select('teacherCode fullName dob gender nationalIdNumber phone address department')
      .lean();
    return teacher ? { ...teacher, role } : null;
  }
  return null;
};

const verifyRecaptcha = async (token) => {
  const payload = new URLSearchParams({
    secret: RECAPTCHA_SECRET_KEY,
    response: token,
  });

  const googleResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: payload.toString(),
  });

  const data = await googleResponse.json();

  if (!data.success) {
    const error = new Error('Xác minh reCAPTCHA thất bại.');
    error.status = 400;
    error.codes = data['error-codes'] || [];
    throw error;
  }
};

const login = async ({ username, password }) => {
  const user = await User.findOne({ username: username.trim() });

  if (!user) {
    const error = new Error('Sai tài khoản hoặc mật khẩu.');
    error.status = 401;
    throw error;
  }

  if (!user.status) {
    const error = new Error('Tài khoản đã bị khóa.');
    error.status = 403;
    throw error;
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    const error = new Error('Sai tài khoản hoặc mật khẩu.');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role, jti: randomUUID() },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const fullName = await getFullName(user._id, user.role);

  return { username: user.username, role: user.role, fullName, token };
};

const changePassword = async ({ userId, oldPassword, newPassword, confirmPassword }) => {
  const user = await User.findById(userId).select('_id password status').lean();

  if (!user) {
    const error = new Error('Không tìm thấy tài khoản.');
    error.status = 404;
    throw error;
  }

  if (!user.status) {
    const error = new Error('Tài khoản đã bị khóa.');
    error.status = 403;
    throw error;
  }

  const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordValid) {
    const error = new Error('Mật khẩu cũ không chính xác.');
    error.status = 400;
    throw error;
  }

  if (newPassword !== confirmPassword) {
    const error = new Error('Xác nhận mật khẩu mới không khớp.');
    error.status = 400;
    throw error;
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    const error = new Error('Mật khẩu mới phải khác mật khẩu cũ.');
    error.status = 400;
    throw error;
  }

  await User.findByIdAndUpdate(userId, { password: newPassword }, { runValidators: true });
};

const revokeToken = async ({ jti, exp }) => {
  if (!jti || !exp) return;

  await RevokedToken.findOneAndUpdate(
    { jti },
    {
      $setOnInsert: {
        jti,
        expiresAt: new Date(exp * 1000),
      },
    },
    { upsert: true, new: false }
  );
};

module.exports = { verifyRecaptcha, login, changePassword, getFullName, getProfile, revokeToken };
