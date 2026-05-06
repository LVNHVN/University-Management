const mongoose = require('mongoose');
const {
  listCurriculums,
  createCurriculum,
  getCurriculumDetail,
  updateCurriculum,
  deleteCurriculum,
} = require('../services/curriculum.service');

const normalizeCurriculumPayload = (body = {}) => ({
  curriculumCode: String(body.curriculumCode || '').trim(),
  name: String(body.name || '').trim(),
  subjects: Array.isArray(body.subjects)
    ? body.subjects.map((s) => ({
        subjectId: String(s.subjectId || '').trim(),
        recommendedSemester: Number(s.recommendedSemester),
      }))
    : [],
});

const validateCurriculumPayload = (payload) => {
  if (!payload.curriculumCode) {
    return 'Vui lòng nhập mã chương trình đào tạo.';
  }

  if (!/^[A-Za-z0-9_-]+$/.test(payload.curriculumCode)) {
    return 'Mã chương trình đào tạo chỉ gồm chữ, số, gạch ngang hoặc gạch dưới.';
  }

  if (!payload.name) {
    return 'Vui lòng nhập tên chương trình đào tạo.';
  }

  for (const subject of payload.subjects) {
    if (!mongoose.isValidObjectId(subject.subjectId)) {
      return 'Danh sách môn học chứa môn không hợp lệ.';
    }

    if (!Number.isInteger(subject.recommendedSemester) || subject.recommendedSemester <= 0) {
      return 'Học kỳ khuyến nghị của môn học phải là số nguyên dương.';
    }
  }

  const ids = payload.subjects.map((s) => s.subjectId);

  if (new Set(ids).size !== ids.length) {
    return 'Danh sách môn học không được trùng lặp.';
  }

  return '';
};

const handleListCurriculums = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const curriculums = await listCurriculums(keyword || undefined);
    return res.json({ success: true, curriculums });
  } catch (error) {
    return next(error);
  }
};

const handleCreateCurriculum = async (req, res, next) => {
  const payload = normalizeCurriculumPayload(req.body);
  const validationMessage = validateCurriculumPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const curriculum = await createCurriculum(payload);
    return res.status(201).json({ success: true, curriculum });
  } catch (error) {
    if (error.status === 400 || error.status === 409) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    if (error.code === 11000) {
      const duplicateField = error?.keyPattern ? Object.keys(error.keyPattern)[0] : '';
      const message = duplicateField === 'curriculumCode'
        ? 'Mã chương trình đào tạo đã tồn tại.'
        : 'Dữ liệu bị trùng với ràng buộc duy nhất trong hệ thống. Vui lòng kiểm tra lại.';

      return res.status(409).json({ success: false, message });
    }

    return next(error);
  }
};

const handleGetCurriculumDetail = async (req, res, next) => {
  try {
    const curriculum = await getCurriculumDetail(req.params.id);
    return res.json({ success: true, curriculum });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleUpdateCurriculum = async (req, res, next) => {
  const payload = normalizeCurriculumPayload(req.body);
  const validationMessage = validateCurriculumPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ success: false, message: validationMessage });
  }

  try {
    const curriculum = await updateCurriculum(req.params.id, payload);
    return res.json({ success: true, curriculum });
  } catch (error) {
    if (error.status === 400 || error.status === 404 || error.status === 409) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    if (error.code === 11000) {
      const duplicateField = error?.keyPattern ? Object.keys(error.keyPattern)[0] : '';
      const message = duplicateField === 'curriculumCode'
        ? 'Mã chương trình đào tạo đã tồn tại.'
        : 'Dữ liệu bị trùng với ràng buộc duy nhất trong hệ thống. Vui lòng kiểm tra lại.';

      return res.status(409).json({ success: false, message });
    }

    return next(error);
  }
};

const handleDeleteCurriculum = async (req, res, next) => {
  try {
    await deleteCurriculum(req.params.id);
    return res.json({ success: true, message: 'Đã xóa chương trình đào tạo.' });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  handleListCurriculums,
  handleCreateCurriculum,
  handleGetCurriculumDetail,
  handleUpdateCurriculum,
  handleDeleteCurriculum,
};