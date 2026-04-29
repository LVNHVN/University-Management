const { verifyRecaptcha, login, getFullName, getProfile, revokeToken } = require('../services/auth.service');

const handleVerifyRecaptcha = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Thiếu reCAPTCHA token.' });
  }

  try {
    await verifyRecaptcha(token);
    return res.json({ success: true });
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        errors: error.codes || [],
      });
    }
    return next(error);
  }
};

const handleLogin = async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Thiếu username hoặc password.' });
  }

  try {
    const user = await login({ username, password });
    return res.json({ success: true, user });
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleMe = async (req, res, next) => {
  try {
    const fullName = await getFullName(req.user.id, req.user.role);
    return res.json({
      success: true,
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
        fullName,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const handleProfile = async (req, res, next) => {
  try {
    const profile = await getProfile(req.user.id, req.user.role);
    return res.json({ success: true, profile });
  } catch (error) {
    return next(error);
  }
};

const handleLogout = async (req, res, next) => {
  try {
    await revokeToken({ jti: req.jwt?.jti, exp: req.jwt?.exp });
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = { handleVerifyRecaptcha, handleLogin, handleMe, handleProfile, handleLogout };
