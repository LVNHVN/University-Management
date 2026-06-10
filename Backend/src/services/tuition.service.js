const mongoose = require('mongoose');
const Tuition = require('../../Models/Tuition');
const Student = require('../../Models/Student');
const Semester = require('../../Models/Semester');
const Enrollment = require('../../Models/Enrollment');
const { getMyGrades } = require('./class.service');
const { compareSemester } = require('../utils/semester');
const {
  VIETQR_BANK_ID,
  SCHOOL_BANK_ACCOUNT_NO,
  SCHOOL_BANK_ACCOUNT_NAME,
} = require('../config/env');

const TUITION_PER_CREDIT = 1000;
const QR_EXPIRE_MINUTES = 15;

const ensureVietQrConfig = () => {
  if (!VIETQR_BANK_ID || !SCHOOL_BANK_ACCOUNT_NO || !SCHOOL_BANK_ACCOUNT_NAME) {
    const error = new Error('Chưa cấu hình thông tin tài khoản trường để tạo mã QR.');
    error.status = 500;
    throw error;
  }
};

const buildVietQrImageUrl = ({ amount, transferContent }) => {
  ensureVietQrConfig();

  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(Number(amount) || 0))),
    addInfo: transferContent,
    accountName: SCHOOL_BANK_ACCOUNT_NAME,
  });

  return `https://img.vietqr.io/image/${encodeURIComponent(VIETQR_BANK_ID)}-${encodeURIComponent(SCHOOL_BANK_ACCOUNT_NO)}-compact2.png?${params.toString()}`;
};

const tryBuildVietQrImageUrl = ({ amount, transferContent }) => {
  if (!VIETQR_BANK_ID || !SCHOOL_BANK_ACCOUNT_NO || !SCHOOL_BANK_ACCOUNT_NAME) {
    return '';
  }

  return buildVietQrImageUrl({ amount, transferContent });
};

const generateTransactionId = () => `HP${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

const buildTransferContent = (studentCode, semesterCode, transactionId) => {
  const safeStudentCode = String(studentCode || '').trim() || 'SV';
  const safeSemesterCode = String(semesterCode || '').trim() || 'HK';
  const txSuffix = String(transactionId || '').slice(-6) || '000000';
  return `HP ${safeStudentCode} ${safeSemesterCode} ${txSuffix}`;
};

const computeTuitionItems = (grades = []) => grades.map((grade, index) => {
  const credits = Number(grade?.subject?.credits);
  const normalizedCredits = Number.isFinite(credits) ? credits : 0;
  const amount = normalizedCredits * TUITION_PER_CREDIT;

  return {
    order: index + 1,
    enrollmentId: grade.enrollmentId,
    subjectCode: grade?.subject?.subjectCode || '',
    subjectName: grade?.subject?.name || '',
    credits: normalizedCredits,
    amount,
  };
});

const getMyTuitionOverview = async (userId, requestedSemester) => {
  const student = await Student.findOne({ userId }).select('_id fullName studentCode').lean();

  if (!student) {
    const error = new Error('Không tìm thấy hồ sơ sinh viên.');
    error.status = 404;
    throw error;
  }

  const gradesPayload = await getMyGrades(userId, requestedSemester);
  const semesterCode = gradesPayload?.semester || '';
  const items = computeTuitionItems(gradesPayload?.grades || []);
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const semesterDoc = semesterCode
    ? await Semester.findOne({ code: semesterCode }).select('_id code name').lean()
    : null;

  const tuitionDoc = semesterDoc && totalAmount > 0
    ? await Tuition.findOneAndUpdate(
      { studentId: student._id, semesterId: semesterDoc._id },
      {
        $set: {
          totalAmount: mongoose.Types.Decimal128.fromString(String(Math.round(totalAmount))),
        },
        $setOnInsert: {
          status: 'Unpaid',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean()
    : null;

  const now = Date.now();
  const qrExpiresAt = tuitionDoc?.qrExpiresAt ? new Date(tuitionDoc.qrExpiresAt) : null;
  const hasActiveQr = tuitionDoc?.status !== 'Paid'
    && qrExpiresAt
    && !Number.isNaN(qrExpiresAt.getTime())
    && qrExpiresAt.getTime() > now
    && tuitionDoc?.paymentContent;

  const activeQrImageUrl = hasActiveQr
    ? tryBuildVietQrImageUrl({
        amount: totalAmount,
        transferContent: tuitionDoc.paymentContent,
      })
    : '';

  const activeQr = hasActiveQr && activeQrImageUrl
    ? {
        transactionId: tuitionDoc.transactionId || '',
        transferContent: tuitionDoc.paymentContent || '',
        bankId: VIETQR_BANK_ID || '',
        accountNo: SCHOOL_BANK_ACCOUNT_NO || '',
        accountName: SCHOOL_BANK_ACCOUNT_NAME || '',
        amount: totalAmount,
        expiresAt: qrExpiresAt,
        qrImageUrl: activeQrImageUrl,
      }
    : null;

  return {
    student: {
      fullName: student.fullName || '',
      studentCode: student.studentCode || '',
    },
    semester: semesterCode,
    semesterInfo: gradesPayload?.semesterInfo || null,
    semesters: Array.isArray(gradesPayload?.semesters) ? gradesPayload.semesters : [],
    items,
    totalAmount,
    status: tuitionDoc?.status || 'Unpaid',
    paidAt: tuitionDoc?.paidAt || null,
    transactionId: tuitionDoc?.transactionId || '',
    activeQr,
  };
};

const createMyTuitionQr = async (userId, requestedSemester) => {
  const overview = await getMyTuitionOverview(userId, requestedSemester);

  if (!overview.semester) {
    const error = new Error('Không xác định được học kỳ thanh toán.');
    error.status = 400;
    throw error;
  }

  if (overview.totalAmount <= 0) {
    const error = new Error('Học kỳ này không có học phí cần thanh toán.');
    error.status = 400;
    throw error;
  }

  if (overview.status === 'Paid') {
    const error = new Error('Học phí học kỳ này đã được thanh toán.');
    error.status = 400;
    throw error;
  }

  const student = await Student.findOne({ userId }).select('_id studentCode').lean();
  const semester = await Semester.findOne({ code: overview.semester }).select('_id code').lean();

  if (!student || !semester) {
    const error = new Error('Không tìm thấy thông tin học phí theo học kỳ.');
    error.status = 404;
    throw error;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + QR_EXPIRE_MINUTES * 60 * 1000);
  ensureVietQrConfig();
  const transactionId = generateTransactionId();
  const transferContent = buildTransferContent(student.studentCode, semester.code, transactionId);

  const tuitionDoc = await Tuition.findOneAndUpdate(
    { studentId: student._id, semesterId: semester._id },
    {
      $set: {
        totalAmount: mongoose.Types.Decimal128.fromString(String(Math.round(overview.totalAmount))),
        status: 'Transferred',
        transactionId,
        paymentContent: transferContent,
        qrIssuedAt: now,
        qrExpiresAt: expiresAt,
        paidAt: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  ).lean();

  return {
    transactionId: tuitionDoc.transactionId || transactionId,
    transferContent,
    bankId: VIETQR_BANK_ID,
    accountNo: SCHOOL_BANK_ACCOUNT_NO,
    accountName: SCHOOL_BANK_ACCOUNT_NAME,
    amount: overview.totalAmount,
    expiresAt,
    qrImageUrl: buildVietQrImageUrl({ amount: overview.totalAmount, transferContent }),
  };
};

const listTuitionsForAdmin = async ({ requestedSemester, requestedStatus, keyword }) => {
  const semesters = await Semester.find().select('_id code name startDate endDate').lean();

  const targetSemester = requestedSemester
    ? semesters.find((item) => item.code === requestedSemester)
    : semesters.slice().sort((a, b) => compareSemester(a.code, b.code)).at(-1);

  const students = await Student.find()
    .select('_id studentCode fullName')
    .sort({ studentCode: 1 })
    .lean();

  let tuitionDocs = [];
  let amountByStudentId = new Map();

  if (targetSemester?._id) {
    tuitionDocs = await Tuition.find({ semesterId: targetSemester._id }).lean();

    const totals = await Enrollment.aggregate([
      {
        $lookup: {
          from: 'classes',
          localField: 'classId',
          foreignField: '_id',
          as: 'class',
        },
      },
      { $unwind: '$class' },
      { $match: { 'class.semesterId': targetSemester._id } },
      {
        $lookup: {
          from: 'subjects',
          localField: 'class.subjectId',
          foreignField: '_id',
          as: 'subject',
        },
      },
      {
        $unwind: {
          path: '$subject',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: '$studentId',
          totalCredits: { $sum: { $ifNull: ['$subject.credits', 0] } },
        },
      },
    ]);

    amountByStudentId = new Map(
      totals.map((item) => [
        String(item._id),
        Math.round((Number(item.totalCredits) || 0) * TUITION_PER_CREDIT),
      ]),
    );
  }

  const tuitionByStudentId = new Map(
    tuitionDocs.map((item) => [String(item.studentId), item]),
  );

  const normalizedKeyword = String(keyword || '').trim().toLowerCase();

  return students
    .map((student) => {
      const tuition = tuitionByStudentId.get(String(student._id));
      const computedAmount = amountByStudentId.get(String(student._id)) || 0;

      const storedAmount = Number(tuition?.totalAmount?.toString?.() || 0);
      const effectiveAmount = computedAmount > 0 ? computedAmount : storedAmount;

      return {
      _id: tuition?._id || null,
      student: {
        _id: student?._id || null,
        studentCode: student?.studentCode || '',
        fullName: student?.fullName || '',
      },
      semester: {
        _id: targetSemester?._id || null,
        code: targetSemester?.code || '',
        name: targetSemester?.name || '',
        startDate: targetSemester?.startDate || null,
        endDate: targetSemester?.endDate || null,
      },
      totalAmount: effectiveAmount,
      status: tuition?.status || 'Unpaid',
      transactionId: tuition?.transactionId || '',
      bankReference: tuition?.bankReference || '',
      paymentContent: tuition?.paymentContent || '',
      qrIssuedAt: tuition?.qrIssuedAt || null,
      qrExpiresAt: tuition?.qrExpiresAt || null,
      paidAt: tuition?.paidAt || null,
      }
    })
    .filter((item) => {
      if (!requestedStatus || (requestedStatus !== 'Paid' && requestedStatus !== 'Unpaid' && requestedStatus !== 'Transferred')) {
        return true;
      }

      return item.status === requestedStatus;
    })
    .filter((item) => {
      if (!normalizedKeyword) {
        return true;
      }

      return [
        item.student.studentCode,
        item.student.fullName,
        item.semester.code,
        item.transactionId,
        item.paymentContent,
      ].some((field) => String(field || '').toLowerCase().includes(normalizedKeyword));
    });
};

const getStudentTuitionHistoryForAdmin = async (tuitionId) => {
  if (!mongoose.isValidObjectId(tuitionId)) {
    const error = new Error('ID học phí không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const current = await Tuition.findById(tuitionId)
    .populate('studentId', 'studentCode fullName')
    .lean();

  if (!current?.studentId?._id) {
    const error = new Error('Không tìm thấy bản ghi học phí.');
    error.status = 404;
    throw error;
  }

  const history = await Tuition.find({ studentId: current.studentId._id })
    .populate('semesterId', 'code name startDate endDate')
    .sort({ qrIssuedAt: -1, paidAt: -1, _id: -1 })
    .lean();

  return {
    student: {
      _id: current.studentId._id,
      studentCode: current.studentId.studentCode || '',
      fullName: current.studentId.fullName || '',
    },
    history: history.map((item) => ({
      _id: item._id,
      semester: {
        _id: item?.semesterId?._id || null,
        code: item?.semesterId?.code || '',
        name: item?.semesterId?.name || '',
      },
      totalAmount: Number(item.totalAmount?.toString?.() || 0),
      status: item.status || 'Unpaid',
      transactionId: item.transactionId || '',
      bankReference: item.bankReference || '',
      paymentContent: item.paymentContent || '',
      qrIssuedAt: item.qrIssuedAt || null,
      qrExpiresAt: item.qrExpiresAt || null,
      paidAt: item.paidAt || null,
    })),
  };
};

const confirmTuitionByAdmin = async (tuitionId, { paidAt, transactionId, bankReference } = {}) => {
  if (!mongoose.isValidObjectId(tuitionId)) {
    const error = new Error('ID học phí không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const tuition = await Tuition.findById(tuitionId)
    .populate('studentId', 'studentCode fullName')
    .populate('semesterId', 'code name')
    .lean();

  if (!tuition) {
    const error = new Error('Không tìm thấy bản ghi học phí.');
    error.status = 404;
    throw error;
  }

  if (tuition.status === 'Paid') {
    return {
      tuitionId: tuition._id,
      status: 'Paid',
      alreadyConfirmed: true,
      paidAt: tuition.paidAt || null,
      transactionId: tuition.transactionId || '',
    };
  }

  if (tuition.status === 'Unpaid') {
    const error = new Error('Sinh viên chưa báo đã chuyển khoản, chưa thể xác nhận.');
    error.status = 400;
    throw error;
  }

  const paidDate = paidAt ? new Date(paidAt) : new Date();
  if (Number.isNaN(paidDate.getTime())) {
    const error = new Error('Thời gian xác nhận thanh toán không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const nextTransactionId = String(transactionId || tuition.transactionId || '').trim();
  const nextBankReference = String(bankReference || '').trim();

  const updated = await Tuition.findByIdAndUpdate(
    tuition._id,
    {
      $set: {
        status: 'Paid',
        paidAt: paidDate,
        transactionId: nextTransactionId,
        bankReference: nextBankReference,
      },
    },
    { new: true },
  )
    .populate('studentId', 'studentCode fullName')
    .populate('semesterId', 'code name')
    .lean();

  return {
    tuitionId: updated._id,
    status: updated.status,
    alreadyConfirmed: false,
    paidAt: updated.paidAt || null,
    transactionId: updated.transactionId || '',
    bankReference: updated.bankReference || '',
    student: {
      studentCode: updated?.studentId?.studentCode || '',
      fullName: updated?.studentId?.fullName || '',
    },
    semester: {
      code: updated?.semesterId?.code || '',
      name: updated?.semesterId?.name || '',
    },
  };
};

module.exports = {
  TUITION_PER_CREDIT,
  QR_EXPIRE_MINUTES,
  getMyTuitionOverview,
  createMyTuitionQr,
  listTuitionsForAdmin,
  getStudentTuitionHistoryForAdmin,
  confirmTuitionByAdmin,
};
