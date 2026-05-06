const path = require('path');
const multer = require('multer');
const { getDuplicateKeyMessage } = require('../utils/duplicateKey');
const { normalizeSubjectPayload, validateSubjectPayload } = require('../validators/subjects.validator');
const { listSubjects, getSubjectById, createSubject, updateSubject, deleteSubject } = require('../services/subjects.service');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

const SUPPORTED_SYLLABUS_EXTENSIONS = new Set(['.pdf']);

const validateSyllabusFile = (file) => {
  if (!file) {
    return '';
  }

  const extension = path.extname(String(file.originalname || '')).toLowerCase();
  if (!SUPPORTED_SYLLABUS_EXTENSIONS.has(extension)) {
    return 'Chỉ hỗ trợ tải lên file PDF định dạng .pdf.';
  }

  return '';
};

const parseRemoveSyllabusFlag = (value) => value === true || value === 'true';

const handleListSubjects = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const subjects = await listSubjects(keyword || undefined);
    return res.json({ success: true, subjects });
  } catch (error) {
    return next(error);
  }
};

const handleGetSubject = async (req, res, next) => {
  try {
    const subject = await getSubjectById(req.params.id);
    return res.json({ success: true, subject });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

const handleCreateSubject = async (req, res, next) => {
  const payload = normalizeSubjectPayload(req.body);
  const validationMessage = validateSubjectPayload(payload);
  const fileValidationMessage = validateSyllabusFile(req.file);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  if (fileValidationMessage) {
    return res.status(400).json({ success: false, message: fileValidationMessage });
  }

  try {
    const subject = await createSubject(payload, req.file);
    return res.status(201).json({ success: true, subject });
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

const handleUpdateSubject = async (req, res, next) => {
  const payload = normalizeSubjectPayload(req.body);
  const validationMessage = validateSubjectPayload(payload);
  const fileValidationMessage = validateSyllabusFile(req.file);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  if (fileValidationMessage) {
    return res.status(400).json({ success: false, message: fileValidationMessage });
  }

  try {
    const subject = await updateSubject(req.params.id, payload, {
      syllabusFile: req.file,
      removeSyllabus: parseRemoveSyllabusFlag(req.body.removeSyllabus),
    });
    return res.json({ success: true, subject });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: getDuplicateKeyMessage(error) });
    }
    return next(error);
  }
};

const handleDeleteSubject = async (req, res, next) => {
  try {
    await deleteSubject(req.params.id);
    return res.json({ success: true, message: 'Đã xóa môn học thành công.' });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
};

module.exports = {
  uploadSubjectSyllabus: upload.single('syllabusFile'),
  handleListSubjects,
  handleGetSubject,
  handleCreateSubject,
  handleUpdateSubject,
  handleDeleteSubject,
};
