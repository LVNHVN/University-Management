const multer = require('multer');
const { normalizeStudentPayload, validateStudentPayload } = require('../validators/students.validator');
const { getDuplicateKeyMessage } = require('../utils/duplicateKey');
const { isSupportedImportFile } = require('../utils/importSpreadsheet');
const {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  validateAndParseStudentsCsv,
  batchCreateStudentsFromValidated,
  importStudentsFromCsv,
} = require('../services/students.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
});

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
      return res.status(409).json({ success: false, message: getDuplicateKeyMessage(error) });
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
      return res.status(409).json({ success: false, message: getDuplicateKeyMessage(error) });
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

const handleImportStudentsFromCsv = [
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
      const result = await importStudentsFromCsv(req.file.buffer, fileMeta);

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

const handlePreviewStudentsImport = [
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
      const result = await validateAndParseStudentsCsv(req.file.buffer, fileMeta);

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

const handleCommitStudentsImport = async (req, res, next) => {
  const { validRows } = req.body;

  if (!Array.isArray(validRows)) {
    return res.status(400).json({ success: false, message: 'Dữ liệu preview không hợp lệ.' });
  }

  try {
    const { createdRows, errors } = await batchCreateStudentsFromValidated(validRows);

    return res.json({
      success: true,
      message: `Đã lưu ${createdRows.length}/${validRows.length} sinh viên.`,
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
  handleListStudents,
  handleGetStudent,
  handleCreateStudent,
  handleUpdateStudent,
  handleDeleteStudent,
  handleImportStudentsFromCsv,
  handlePreviewStudentsImport,
  handleCommitStudentsImport,
};
