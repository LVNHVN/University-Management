const normalizeStudentPayload = (body = {}) => ({
  studentCode: String(body.studentCode || '').trim(),
  fullName: String(body.fullName || '').trim(),
  dob: String(body.dob || '').trim(),
  gender: String(body.gender || '').trim(),
  nationalIdNumber: String(body.nationalIdNumber || '').trim(),
  phone: String(body.phone || '').trim(),
  address: String(body.address || '').trim(),
  major: String(body.major || '').trim(),
  academicYear: String(body.academicYear || '').trim(),
});

const validateStudentPayload = (payload) => {
  if (!payload.studentCode) {
    return 'Vui lòng nhập mã số sinh viên.';
  }

  if (!/^\d+$/.test(payload.studentCode)) {
    return 'Mã số sinh viên chỉ được nhập số.';
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

  if (!payload.major) {
    return 'Vui lòng nhập ngành.';
  }

  if (!payload.academicYear) {
    return 'Vui lòng nhập khóa học.';
  }

  if (!/^\d+$/.test(payload.academicYear)) {
    return 'Khóa học chỉ được nhập số.';
  }

  return '';
};

module.exports = { normalizeStudentPayload, validateStudentPayload };
