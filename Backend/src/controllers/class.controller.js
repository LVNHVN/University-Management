const multer = require('multer');
const mongoose = require('mongoose');
const Class = require('../../Models/Class');
const Teacher = require('../../Models/Teacher');
const { isSupportedImportFile } = require('../utils/importSpreadsheet');
const {
  createClass,
  listClasses,
  getClassDetail,
  updateClass,
  deleteClass,
  getClassStudents,
  getMySchedule,
  getMyGrades,
  getMyGradeSummary,
  updateStudentGrades,
  importClassGradesFromFile,
  getClassAttendanceByDate,
  updateClassAttendanceByDate,
} = require('../services/class.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

const ensureTeacherCanAccessClass = async (classId, user) => {
  if (user?.role !== 'teacher') {
    return null;
  }

  const teacher = await Teacher.findOne({ userId: user.id }).select('_id').lean();

  if (!teacher) {
    const error = new Error('Không tìm thấy hồ sơ giảng viên.');
    error.status = 404;
    throw error;
  }

  const assignedClass = await Class.findOne({ _id: classId, teacherId: teacher._id }).select('_id').lean();
  if (!assignedClass) {
    const error = new Error('Bạn không có quyền truy cập lớp này.');
    error.status = 403;
    throw error;
  }

  return teacher;
};

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

    await ensureTeacherCanAccessClass(id, req.user);

    const data = await getClassStudents(id);
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

const handleUpdateStudentGrades = async (req, res, next) => {
  try {
    const { id, enrollmentId } = req.params;

    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(enrollmentId)) {
      return res.status(400).json({ success: false, message: 'ID không hợp lệ.' });
    }

    await ensureTeacherCanAccessClass(id, req.user);

    const gradePayload = {
      gradeProcess: req.body?.gradeProcess,
      gradeFinal: req.body?.gradeFinal,
    };

    const updated = await updateStudentGrades(id, enrollmentId, gradePayload);
    return res.json({ success: true, grade: updated });
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleImportClassGrades = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên file điểm.' });
      }

      await ensureTeacherCanAccessClass(id, req.user);

      const fileMeta = {
        fileName: String(req.file.originalname || ''),
        mimeType: String(req.file.mimetype || ''),
      };

      if (!isSupportedImportFile(fileMeta)) {
        return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ định dạng .csv, .xlsx hoặc .xls ở chức năng này.' });
      }

      const result = await importClassGradesFromFile(id, req.file.buffer, fileMeta);

      return res.json({
        success: true,
        message: `Đã cập nhật điểm cho ${result.summary.updatedRows}/${result.summary.totalRows} dòng.`,
        ...result,
      });
    } catch (error) {
      if (error.status === 400 || error.status === 403 || error.status === 404) {
        return res.status(error.status).json({ success: false, message: error.message });
      }

      return next(error);
    }
  },
];

const handleGetClassAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = String(req.query.date || '').trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    await ensureTeacherCanAccessClass(id, req.user);

    const data = await getClassAttendanceByDate(id, date);
    return res.json({ success: true, data });
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleUpdateClassAttendance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const date = String(req.query.date || '').trim();

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID lớp học không hợp lệ.' });
    }

    await ensureTeacherCanAccessClass(id, req.user);

    const records = Array.isArray(req.body?.records) ? req.body.records : null;
    if (!records) {
      return res.status(400).json({ success: false, message: 'Dữ liệu điểm danh không hợp lệ.' });
    }

    const data = await updateClassAttendanceByDate(id, date, records, req.user.id);
    return res.json({ success: true, data, message: 'Đã lưu điểm danh thành công.' });
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

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

const handleGetMyGrades = async (req, res, next) => {
  try {
    const requestedSemester = String(req.query.semester || '').trim() || undefined;
    const grades = await getMyGrades(req.user.id, requestedSemester);
    return res.json({ success: true, grades });
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleGetMyGradeSummary = async (req, res, next) => {
  try {
    const summary = await getMyGradeSummary(req.user.id);
    return res.json({ success: true, summary });
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
  handleUpdateStudentGrades,
  handleImportClassGrades,
  handleGetClassAttendance,
  handleUpdateClassAttendance,
  handleGetMySchedule,
  handleGetMyGrades,
  handleGetMyGradeSummary,
};
