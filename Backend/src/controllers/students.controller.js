const { normalizeStudentPayload, validateStudentPayload } = require('../validators/students.validator');
const { listStudents, getStudentById, createStudent, updateStudent, deleteStudent } = require('../services/students.service');

const handleListStudents = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const students = await listStudents(keyword || undefined);
    return res.json({ success: true, students });
  } catch (error) {
    return next(error);
  }
};

const handleGetStudent = async (req, res, next) => {
  try {
    const student = await getStudentById(req.params.id);
    return res.json({ success: true, student });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleCreateStudent = async (req, res, next) => {
  const payload = normalizeStudentPayload(req.body);
  const validationMessage = validateStudentPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const student = await createStudent(payload);
    return res.status(201).json({ success: true, student });
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

const handleUpdateStudent = async (req, res, next) => {
  const payload = normalizeStudentPayload(req.body);
  const validationMessage = validateStudentPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const student = await updateStudent(req.params.id, payload);
    return res.json({ success: true, student });
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

const handleDeleteStudent = async (req, res, next) => {
  try {
    await deleteStudent(req.params.id);
    return res.json({ success: true, message: 'Đã xóa sinh viên thành công.' });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = { handleListStudents, handleGetStudent, handleCreateStudent, handleUpdateStudent, handleDeleteStudent };
