const multer = require('multer');
const { normalizeTeacherPayload, validateTeacherPayload } = require('../validators/teachers.validator');
const { getDuplicateKeyMessage } = require('../utils/duplicateKey');
const { isSupportedImportFile } = require('../utils/importSpreadsheet');
const {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  validateAndParseTeachersCsv,
  batchCreateTeachersFromValidated,
  importTeachersFromCsv,
} = require('../services/teachers.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

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
      return res.status(409).json({ success: false, message: getDuplicateKeyMessage(error) });
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
      return res.status(409).json({ success: false, message: getDuplicateKeyMessage(error) });
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

const handleImportTeachersFromCsv = [
  upload.single('file'),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file CSV.' });
    }

    const fileMeta = {
      fileName: String(req.file.originalname || ''),
      mimeType: String(req.file.mimetype || ''),
    };

    if (!isSupportedImportFile(fileMeta)) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ định dạng .csv, .xlsx hoặc .xls ở chức năng này.' });
    }

    try {
      const result = await importTeachersFromCsv(req.file.buffer, fileMeta);

      return res.json({
        success: true,
        message: `Đã import ${result.summary.createdRows}/${result.summary.totalRows} dòng hợp lệ.`,
        ...result,
      });
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return next(error);
    }
  },
];

const handlePreviewTeachersImport = [
  upload.single('file'),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Vui lòng tải lên file CSV.' });
    }

    const fileMeta = {
      fileName: String(req.file.originalname || ''),
      mimeType: String(req.file.mimetype || ''),
    };

    if (!isSupportedImportFile(fileMeta)) {
      return res.status(400).json({ success: false, message: 'Chỉ hỗ trợ định dạng .csv, .xlsx hoặc .xls ở chức năng này.' });
    }

    try {
      const result = await validateAndParseTeachersCsv(req.file.buffer, fileMeta);

      return res.json({
        success: true,
        summary: {
          totalRows: result.totalRows,
          validRows: result.validRows.length,
          errorRows: result.errors.length,
        },
        validRows: result.validRows,
        errors: result.errors,
      });
    } catch (error) {
      if (error.status === 400) {
        return res.status(400).json({ success: false, message: error.message });
      }

      return next(error);
    }
  },
];

const handleCommitTeachersImport = async (req, res, next) => {
  const { validRows } = req.body;

  if (!Array.isArray(validRows)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu preview không hợp lệ.' });
  }

  try {
    const { createdRows, errors } = await batchCreateTeachersFromValidated(validRows);

    return res.json({
      success: true,
      message: `Đã lưu ${createdRows.length}/${validRows.length} giảng viên.`,
      summary: {
        totalRows: validRows.length,
        createdRows: createdRows.length,
        failedRows: errors.length,
      },
      createdRows,
      errors,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  handleListTeachers,
  handleGetTeacher,
  handleCreateTeacher,
  handleUpdateTeacher,
  handleDeleteTeacher,
  handleImportTeachersFromCsv,
  handlePreviewTeachersImport,
  handleCommitTeachersImport,
};
