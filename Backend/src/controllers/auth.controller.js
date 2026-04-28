const { verifyRecaptcha, login } = require('../services/auth.service');

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

module.exports = { handleVerifyRecaptcha, handleLogin };
