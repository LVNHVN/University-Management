const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');
const RevokedToken = require('../../Models/RevokedToken');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Chưa xác thực.' });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.jti) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }

    const revokedToken = await RevokedToken.findOne({ jti: decoded.jti }).select('_id').lean();
    if (revokedToken) {
      return res.status(401).json({ success: false, message: 'Token đã bị thu hồi.' });
    }

    req.user = decoded;
    req.token = token;
    req.jwt = decoded;
    return next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Không có quyền truy cập.' });
  }
  return next();
};

module.exports = { authenticate, authorize };
