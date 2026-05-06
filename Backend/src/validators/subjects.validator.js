const normalizeSubjectPayload = (body = {}) => ({
  subjectCode: String(body.subjectCode || '').trim(),
  name: String(body.name || '').trim(),
  department: String(body.department || '').trim(),
  credits: Number(body.credits),
  finalWeight: Number(body.finalWeight),
});

const validateSubjectPayload = (payload) => {
  if (!payload.subjectCode) {
    return 'Vui lòng nhập mã môn học.';
  }

  if (!/^[A-Za-z0-9_\-]+$/.test(payload.subjectCode)) {
    return 'Mã môn học chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới.';
  }

  if (!payload.name) {
    return 'Vui lòng nhập tên môn học.';
  }

  if (!payload.department) {
    return 'Vui lòng nhập khoa/viện phụ trách môn học.';
  }

  if (!Number.isInteger(payload.credits) || payload.credits <= 0) {
    return 'Số tín chỉ phải là số nguyên dương.';
  }

  if (!Number.isFinite(payload.finalWeight) || payload.finalWeight < 0 || payload.finalWeight > 1) {
    return 'Trọng số điểm thi cuối kỳ phải nằm trong khoảng từ 0 đến 1.';
  }

  return '';
};

module.exports = { normalizeSubjectPayload, validateSubjectPayload };
