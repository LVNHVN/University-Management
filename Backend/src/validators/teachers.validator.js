const normalizeDatePart = (value) => String(value || '').trim();

const isValidDateParts = (year, month, day) => {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return false;
  }

  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }

  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

const normalizeDobToIso = (input) => {
  const raw = normalizeDatePart(input);

  if (!raw) {
    return '';
  }

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return isValidDateParts(year, month, day) ? raw : raw;
  }

  const vnMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    const [, day, month, year] = vnMatch;
    if (!isValidDateParts(year, month, day)) {
      return raw;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  return raw;
};

const isNormalizedIsoDob = (input) => {
  const raw = normalizeDatePart(input);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!isoMatch) {
    return false;
  }

  const [, year, month, day] = isoMatch;
  return isValidDateParts(year, month, day);
};

const normalizeTeacherPayload = (body = {}) => ({
  teacherCode: String(body.teacherCode || '').trim(),
  fullName: String(body.fullName || '').trim(),
  dob: normalizeDobToIso(body.dob),
  gender: String(body.gender || '').trim(),
  nationalIdNumber: String(body.nationalIdNumber || '').trim().replace(/^'/, ''),
  phone: String(body.phone || '').trim().replace(/^'/, ''),
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

  if (!isNormalizedIsoDob(payload.dob)) {
    return 'Ngày sinh phải đúng định dạng dd/mm/yyyy hoặc yyyy-mm-dd.';
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
