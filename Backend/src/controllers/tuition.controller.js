const {
  getMyTuitionOverview,
  createMyTuitionQr,
  listTuitionsForAdmin,
  getStudentTuitionHistoryForAdmin,
  confirmTuitionByAdmin,
} = require('../services/tuition.service');

const handleGetMyTuition = async (req, res, next) => {
  try {
    const requestedSemester = String(req.query.semester || '').trim() || undefined;
    const tuition = await getMyTuitionOverview(req.user.id, requestedSemester);
    return res.json({ success: true, tuition });
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleCreateMyTuitionQr = async (req, res, next) => {
  try {
    const requestedSemester = String(req.body?.semester || '').trim() || undefined;
    const qr = await createMyTuitionQr(req.user.id, requestedSemester);
    return res.status(201).json({ success: true, qr });
  } catch (error) {
    if (error.status === 400 || error.status === 403 || error.status === 404 || error.status === 500) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleListTuitionsForAdmin = async (req, res, next) => {
  try {
    const requestedSemester = String(req.query.semester || '').trim() || '';
    const requestedStatus = String(req.query.status || '').trim() || '';
    const keyword = String(req.query.search || '').trim() || '';

    const tuitions = await listTuitionsForAdmin({
      requestedSemester,
      requestedStatus,
      keyword,
    });

    return res.json({ success: true, tuitions });
  } catch (error) {
    return next(error);
  }
};

const handleConfirmTuitionByAdmin = async (req, res, next) => {
  try {
    const result = await confirmTuitionByAdmin(req.params.id, {
      paidAt: req.body?.paidAt,
      transactionId: req.body?.transactionId,
      bankReference: req.body?.bankReference,
    });

    return res.json({ success: true, message: 'Đã xác nhận thanh toán học phí.', result });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

const handleGetStudentTuitionHistoryForAdmin = async (req, res, next) => {
  try {
    const result = await getStudentTuitionHistoryForAdmin(req.params.id);
    return res.json({ success: true, ...result });
  } catch (error) {
    if (error.status === 400 || error.status === 404) {
      return res.status(error.status).json({ success: false, message: error.message });
    }

    return next(error);
  }
};

module.exports = {
  handleGetMyTuition,
  handleCreateMyTuitionQr,
  handleListTuitionsForAdmin,
  handleGetStudentTuitionHistoryForAdmin,
  handleConfirmTuitionByAdmin,
};
