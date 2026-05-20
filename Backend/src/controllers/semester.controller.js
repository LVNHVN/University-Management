const mongoose = require('mongoose');
const {
  listSemesters,
  getSemesterDetail,
  createSemester,
  updateSemester,
} = require('../services/semester.service');

const normalizeSemesterPayload = (body = {}) => ({
  code: String(body.code || '').trim(),
  name: String(body.name || '').trim(),
  startDate: String(body.startDate || '').trim(),
  endDate: String(body.endDate || '').trim(),
});

const parseDateOnly = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
};

const validateSemesterPayload = (payload, { isCreate } = { isCreate: true }) => {
  if (isCreate) {
    if (!payload.code) {
      return 'Vui lòng nhập mã học kỳ.';
    }

    if (!/^\d{4}\.\d+$/.test(payload.code)) {
      return 'Mã học kỳ phải theo định dạng YYYY.T (ví dụ 2025.2).';
    }
  }

  if (!payload.name) {
    return 'Vui lòng nhập tên học kỳ.';
  }

  const startDate = parseDateOnly(payload.startDate);
  if (!startDate) {
    return 'Ngày bắt đầu không hợp lệ (định dạng YYYY-MM-DD).';
  }

  const endDate = parseDateOnly(payload.endDate);
  if (!endDate) {
    return 'Ngày kết thúc không hợp lệ (định dạng YYYY-MM-DD).';
  }

  if (startDate > endDate) {
    return 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc.';
  }

  return '';
};

const mapPayloadToServiceInput = (payload) => ({
  code: payload.code,
  name: payload.name,
  startDate: parseDateOnly(payload.startDate),
  endDate: parseDateOnly(payload.endDate),
});

const handleListSemesters = async (req, res, next) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const semesters = await listSemesters(keyword || undefined);
    return res.json({ success: true, semesters });
  } catch (error) {
    return next(error);
  }
};

const handleGetSemesterDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID học kỳ không hợp lệ.' });
    }

    const semester = await getSemesterDetail(id);
    return res.json({ success: true, semester });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleCreateSemester = async (req, res, next) => {
  try {
    const payload = normalizeSemesterPayload(req.body);
    const validationError = validateSemesterPayload(payload, { isCreate: true });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const semester = await createSemester(mapPayloadToServiceInput(payload));
    return res.status(201).json({ success: true, semester });
  } catch (error) {
    if (error.status === 409) {
      return res.status(409).json({ success: false, message: error.message });
    }

    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Mã học kỳ đã tồn tại.' });
    }

    return next(error);
  }
};

const handleUpdateSemester = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'ID học kỳ không hợp lệ.' });
    }

    const payload = normalizeSemesterPayload(req.body);
    const validationError = validateSemesterPayload(payload, { isCreate: false });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const semester = await updateSemester(id, mapPayloadToServiceInput(payload));
    return res.json({ success: true, semester });
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  handleListSemesters,
  handleGetSemesterDetail,
  handleCreateSemester,
  handleUpdateSemester,
};
