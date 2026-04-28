const { getStudentAccount, getTeacherAccount, updateAccount } = require('../services/accounts.service');

const handleGetStudentAccount = async (req, res, next) => {
  try {
    const account = await getStudentAccount(req.params.id);
    return res.json({ success: true, account });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleGetTeacherAccount = async (req, res, next) => {
  try {
    const account = await getTeacherAccount(req.params.id);
    return res.json({ success: true, account });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleUpdateAccount = async (req, res, next) => {
  const { resetPassword, status } = req.body;
  const shouldResetPassword = resetPassword === true;
  const hasStatus = typeof status === 'boolean';

  if (!shouldResetPassword && !hasStatus) {
    return res.status(400).json({ success: false, message: 'Thiếu dữ liệu cập nhật tài khoản.' });
  }

  try {
    const result = await updateAccount(req.params.id, { resetPassword: shouldResetPassword, status });
    return res.json({ success: true, message: result.message, account: result.account });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = { handleGetStudentAccount, handleGetTeacherAccount, handleUpdateAccount };
