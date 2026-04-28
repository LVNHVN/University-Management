const { RECAPTCHA_SECRET_KEY } = require('../config/env');
const User = require('../../Models/User');
const bcrypt = require('bcryptjs');

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

  return { username: user.username, role: user.role };
};

module.exports = { verifyRecaptcha, login };
