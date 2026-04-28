const normalizeTeacherPayload = (body = {}) => ({
  teacherCode: String(body.teacherCode || '').trim(),
  fullName: String(body.fullName || '').trim(),
  dob: String(body.dob || '').trim(),
  gender: String(body.gender || '').trim(),
  nationalIdNumber: String(body.nationalIdNumber || '').trim(),
  phone: String(body.phone || '').trim(),
  address: String(body.address || '').trim(),
  department: String(body.department || '').trim(),
});

const validateTeacherPayload = (payload) => {
  if (!payload.teacherCode) {
    return 'Vui lòng nhập mã số giảng viên.';
  }

  if (!/^\d+$/.test(payload.teacherCode)) {
    return 'Mã số giảng viên chỉ được nhập số.';
  }

  if (!payload.fullName) {
    return 'Vui lòng nhập họ và tên.';
  }

  if (!/^[\p{L}\s]+$/u.test(payload.fullName)) {
    return 'Họ và tên chỉ được nhập chữ.';
  }

  if (!payload.dob) {
    return 'Vui lòng nhập ngày sinh.';
  }

  if (Number.isNaN(new Date(payload.dob).getTime())) {
    return 'Ngày sinh không hợp lệ.';
  }

  if (!payload.gender) {
    return 'Vui lòng chọn giới tính.';
  }

  if (!['Nam', 'Nữ'].includes(payload.gender)) {
    return 'Giới tính chỉ được chọn Nam hoặc Nữ.';
  }

  if (!payload.nationalIdNumber) {
    return 'Vui lòng nhập CCCD.';
  }

  if (!/^\d{12}$/.test(payload.nationalIdNumber)) {
    return 'CCCD phải gồm đúng 12 số.';
  }

  if (!payload.phone) {
    return 'Vui lòng nhập số điện thoại.';
  }

  if (!/^\d{10}$/.test(payload.phone)) {
    return 'Số điện thoại phải gồm đúng 10 số.';
  }

  if (!payload.address) {
    return 'Vui lòng nhập địa chỉ.';
  }

  if (!payload.department) {
    return 'Vui lòng nhập khoa/viện công tác.';
  }

  return '';
};

module.exports = { normalizeTeacherPayload, validateTeacherPayload };
