const mongoose = require('mongoose');
const {
  createClass,
  listClasses,
  getClassDetail,
  updateClass,
  deleteClass,
  getClassStudents,
  getMySchedule,
} = require('../services/class.service');

const normalizeClassPayload = (body = {}) => ({
  classCode: String(body.classCode || '').trim(),
  subjectId: String(body.subjectId || '').trim(),
  teacherId: String(body.teacherId || '').trim(),
  semester: String(body.semester || '').trim(),
  dayOfWeek: body.dayOfWeek != null && body.dayOfWeek !== '' ? Math.round(Number(body.dayOfWeek)) : null,
  startTime: String(body.startTime || '').trim(),
  endTime: String(body.endTime || '').trim(),
  room: String(body.room || '').trim(),
});

const validateClassPayload = (payload) => {
  if (!payload.classCode) {
    return 'Vui lòng nhập mã lớp học.';
  }

  if (!/^[A-Za-z0-9_-]+$/.test(payload.classCode)) {
    return 'Mã lớp học chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.';
  }

  if (!payload.subjectId || !mongoose.isValidObjectId(payload.subjectId)) {
    return 'Vui lòng chọn môn học hợp lệ.';
  }

  if (!payload.teacherId || !mongoose.isValidObjectId(payload.teacherId)) {
    return 'Vui lòng chọn giảng viên hợp lệ.';
  }

  if (!payload.semester) {
    return 'Vui lòng chọn học kỳ.';
  }

  if (payload.dayOfWeek === null || payload.dayOfWeek < 1 || payload.dayOfWeek > 7) {
    return 'Vui lòng chọn thứ học.';
  }

  const timeRegex = /^\d{2}:\d{2}$/;

  if (!payload.startTime || !timeRegex.test(payload.startTime)) {
    return 'Vui lòng nhập giờ bắt đầu (định dạng HH:MM).';
  }

  if (!payload.endTime || !timeRegex.test(payload.endTime)) {
    return 'Vui lòng nhập giờ kết thúc (định dạng HH:MM).';
  }

  if (!payload.room) {
    return 'Vui lòng nhập phòng học.';
  }

  return '';
};

const handleListClasses = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const classes = await listClasses(keyword || undefined);
    return res.json({ success: true, classes });
  } catch (error) {
    return next(error);
  }
};

const handleCreateClass = async (req, res, next) => {
  try {
    const payload = normalizeClassPayload(req.body);
    const validationError = validateClassPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const cls = await createClass(payload);
    return res.status(201).json({ success: true, class: cls });
  } catch (error) {
    return next(error);
  }
};

const handleGetClassDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    const cls = await getClassDetail(id);
    return res.json({ success: true, class: cls });
  } catch (error) {
    return next(error);
  }
};

const handleUpdateClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    const payload = normalizeClassPayload(req.body);
    const validationError = validateClassPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const cls = await updateClass(id, payload);
    return res.json({ success: true, class: cls });
  } catch (error) {
    return next(error);
  }
};

const handleDeleteClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    await deleteClass(id);
    return res.json({ success: true, message: 'Xóa lớp học thành công.' });
  } catch (error) {
    return next(error);
  }
};

const handleGetClassStudents = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    const data = await getClassStudents(id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const handleGetMySchedule = async (req, res, next) => {
  try {
    const requestedSemester = String(req.query.semester || '').trim() || undefined;
    const schedule = await getMySchedule(req.user.id, req.user.role, requestedSemester);
    return res.json({ success: true, schedule });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  handleListClasses,
  handleCreateClass,
  handleGetClassDetail,
  handleUpdateClass,
  handleDeleteClass,
  handleGetClassStudents,
  handleGetMySchedule,
};
