const { normalizeTeacherPayload, validateTeacherPayload } = require('../validators/teachers.validator');
const { listTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher } = require('../services/teachers.service');

const handleListTeachers = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const teachers = await listTeachers(keyword || undefined);
    return res.json({ success: true, teachers });
  } catch (error) {
    return next(error);
  }
};

const handleGetTeacher = async (req, res, next) => {
  try {
    const teacher = await getTeacherById(req.params.id);
    return res.json({ success: true, teacher });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleCreateTeacher = async (req, res, next) => {
  const payload = normalizeTeacherPayload(req.body);
  const validationMessage = validateTeacherPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const teacher = await createTeacher(payload);
    return res.status(201).json({ success: true, teacher });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' });
    }
    return next(error);
  }
};

const handleUpdateTeacher = async (req, res, next) => {
  const payload = normalizeTeacherPayload(req.body);
  const validationMessage = validateTeacherPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const teacher = await updateTeacher(req.params.id, payload);
    return res.json({ success: true, teacher });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' });
    }
    return next(error);
  }
};

const handleDeleteTeacher = async (req, res, next) => {
  try {
    await deleteTeacher(req.params.id);
    return res.json({ success: true, message: 'Đã xóa giảng viên thành công.' });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = { handleListTeachers, handleGetTeacher, handleCreateTeacher, handleUpdateTeacher, handleDeleteTeacher };
