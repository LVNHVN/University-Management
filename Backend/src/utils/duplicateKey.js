const DUPLICATE_KEY_FIELD_MESSAGES = {
  studentCode: 'Mã số sinh viên đã tồn tại.',
  teacherCode: 'Mã số giảng viên đã tồn tại.',
  nationalIdNumber: 'CCCD đã tồn tại ở sinh viên hoặc giảng viên khác.',
  phone: 'Số điện thoại đã tồn tại ở sinh viên hoặc giảng viên khác.',
  username: 'Tên tài khoản đã tồn tại.',
  userId: 'Tài khoản đã được liên kết với hồ sơ khác.',
};

const getDuplicateKeyField = (error = {}) => {
  if (error?.keyPattern && typeof error.keyPattern === 'object') {
    const keys = Object.keys(error.keyPattern);
    if (keys.length > 0) {
      return keys[0];
    }
  }

  if (error?.keyValue && typeof error.keyValue === 'object') {
    const keys = Object.keys(error.keyValue);
    if (keys.length > 0) {
      return keys[0];
    }
  }

  return null;
};

const getDuplicateKeyMessage = (error, fallbackMessage = 'Dữ liệu bị trùng, vui lòng kiểm tra lại.') => {
  if (!error || error.code !== 11000) {
    return fallbackMessage;
  }

  const field = getDuplicateKeyField(error);
  if (!field) {
    return fallbackMessage;
  }

  return DUPLICATE_KEY_FIELD_MESSAGES[field] || fallbackMessage;
};

module.exports = { getDuplicateKeyMessage };
