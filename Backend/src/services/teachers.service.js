const Teacher = require('../../Models/Teacher');
const User = require('../../Models/User');
const Student = require('../../Models/Student');
const { buildTeacherUsername } = require('../utils/username');
const { checkDuplicateIdentityAcrossStudentsAndTeachers } = require('../utils/duplicateIdentity');
const { getDuplicateKeyMessage } = require('../utils/duplicateKey');
const { parseImportRecords } = require('../utils/importSpreadsheet');
const { DEFAULT_ACCOUNT_PASSWORD } = require('../config/env');
const { normalizeTeacherPayload, validateTeacherPayload } = require('../validators/teachers.validator');

const TEACHER_IMPORT_COLUMNS = [
  'teacherCode',
  'fullName',
  'dob',
  'gender',
  'nationalIdNumber',
  'phone',
  'address',
  'department',
];

const TEACHER_IMPORT_HEADERS_VI = [
  'Mã số giảng viên',
  'Họ và tên',
  'Ngày sinh',
  'Giới tính',
  'Số căn cước công dân',
  'Số điện thoại',
  'Địa chỉ',
  'Khoa/viện công tác',
];

const normalizeHeaderText = (value) => String(value || '').trim().toLowerCase();

const hasAllExpectedHeaders = (record = {}, expectedHeaders) => {
  const availableHeaders = new Set(Object.keys(record).map(normalizeHeaderText));

  return expectedHeaders.every((header) => availableHeaders.has(normalizeHeaderText(header)));
};

const mapRecordByHeaders = (record = {}, expectedColumns, expectedHeaders) => {
  const entries = Object.entries(record || {});

  const valueByNormalizedHeader = new Map(
    entries.map(([key, value]) => [normalizeHeaderText(key), value])
  );

  return expectedColumns.reduce((acc, column, index) => {
    acc[column] = valueByNormalizedHeader.get(normalizeHeaderText(expectedHeaders[index])) ?? '';

    return acc;
  }, {});
};

const listTeachers = async (keyword) => {
  const filter = keyword
    ? {
        $or: [
          { teacherCode: { $regex: keyword, $options: 'i' } },
          { fullName: { $regex: keyword, $options: 'i' } },
        ],
      }
    : {};

  return Teacher.find(filter)
    .sort({ teacherCode: 1 })
    .select('teacherCode fullName dob gender phone address department nationalIdNumber userId');
};

const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id)
    .select('teacherCode fullName dob gender phone address department nationalIdNumber userId');

  if (!teacher) {
    const error = new Error('Không tìm thấy giảng viên.');
    error.status = 404;
    throw error;
  }

  return teacher;
};

const createTeacher = async (payload) => {
  const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
    nationalIdNumber: payload.nationalIdNumber,
    phone: payload.phone,
  });

  if (duplicateIdentityMessage) {
    const error = new Error(duplicateIdentityMessage);
    error.status = 409;
    throw error;
  }

  const existingTeacher = await Teacher.findOne({ teacherCode: payload.teacherCode });
  if (existingTeacher) {
    const error = new Error('Mã số giảng viên đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const username = buildTeacherUsername(payload.teacherCode);
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    const error = new Error('Tài khoản giảng viên đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const createdUser = await User.create({
    username,
    password: DEFAULT_ACCOUNT_PASSWORD,
    role: 'teacher',
    status: true,
  });

  try {
    const teacher = await Teacher.create({
      userId: createdUser._id,
      teacherCode: payload.teacherCode,
      fullName: payload.fullName,
      dob: payload.dob,
      gender: payload.gender,
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      address: payload.address,
      department: payload.department,
    });

    return teacher;
  } catch (err) {
    await User.findByIdAndDelete(createdUser._id);
    throw err;
  }
};

const updateTeacher = async (id, payload) => {
  const existingTeacher = await Teacher.findById(id).select('userId');

  if (!existingTeacher) {
    const error = new Error('Không tìm thấy giảng viên.');
    error.status = 404;
    throw error;
  }

  const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
    nationalIdNumber: payload.nationalIdNumber,
    phone: payload.phone,
    excludeTeacherId: id,
  });

  if (duplicateIdentityMessage) {
    const error = new Error(duplicateIdentityMessage);
    error.status = 409;
    throw error;
  }

  const expectedUsername = buildTeacherUsername(payload.teacherCode);
  const usernameExists = await User.findOne({
    username: expectedUsername,
    _id: { $ne: existingTeacher.userId },
  }).select('_id').lean();

  if (usernameExists) {
    const error = new Error('Tên tài khoản giảng viên chuẩn đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const teacher = await Teacher.findByIdAndUpdate(
    id,
    {
      teacherCode: payload.teacherCode,
      fullName: payload.fullName,
      dob: payload.dob,
      gender: payload.gender,
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      address: payload.address,
      department: payload.department,
    },
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(existingTeacher.userId, { username: expectedUsername }, { runValidators: true });

  return teacher;
};

const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id);

  if (!teacher) {
    const error = new Error('Không tìm thấy giảng viên.');
    error.status = 404;
    throw error;
  }

  await User.findByIdAndDelete(teacher.userId);
};

const parseTeachersCsvBuffer = (fileBuffer, fileMeta = {}) => {
  const records = parseImportRecords(fileBuffer, fileMeta);

  if (!records.length) {
    const error = new Error('File import không có dữ liệu.');
    error.status = 400;
    throw error;
  }

  const firstRow = records[0] || {};
  const headersMatchByName = hasAllExpectedHeaders(firstRow, TEACHER_IMPORT_HEADERS_VI);

  if (!headersMatchByName) {
    const error = new Error(`File thiếu cột bắt buộc. Header chuẩn: ${TEACHER_IMPORT_HEADERS_VI.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  return records.map((record) => mapRecordByHeaders(record, TEACHER_IMPORT_COLUMNS, TEACHER_IMPORT_HEADERS_VI));
};

const validateAndParseTeachersCsv = async (fileBuffer, fileMeta = {}) => {
  const records = parseTeachersCsvBuffer(fileBuffer, fileMeta);

  const errors = [];
  const validRows = [];
  const seenTeacherCodes = new Map();
  const seenNationalIds = new Map();
  const seenPhones = new Map();

  records.forEach((row, index) => {
    const rowNumber = index + 2;
    const payload = normalizeTeacherPayload(row);
    const validationMessage = validateTeacherPayload(payload);

    if (validationMessage) {
      errors.push({ rowNumber, message: validationMessage });
      return;
    }

    if (seenTeacherCodes.has(payload.teacherCode)) {
      errors.push({ rowNumber, message: `MSGV trùng với dòng ${seenTeacherCodes.get(payload.teacherCode)}.` });
      return;
    }

    if (seenNationalIds.has(payload.nationalIdNumber)) {
      errors.push({ rowNumber, message: `CCCD trùng với dòng ${seenNationalIds.get(payload.nationalIdNumber)}.` });
      return;
    }

    if (seenPhones.has(payload.phone)) {
      errors.push({ rowNumber, message: `Số điện thoại trùng với dòng ${seenPhones.get(payload.phone)}.` });
      return;
    }

    seenTeacherCodes.set(payload.teacherCode, rowNumber);
    seenNationalIds.set(payload.nationalIdNumber, rowNumber);
    seenPhones.set(payload.phone, rowNumber);
    validRows.push({ rowNumber, ...payload });
  });

  if (validRows.length > 0) {
    const teacherCodes = [...new Set(validRows.map((row) => row.teacherCode))];
    const nationalIds = [...new Set(validRows.map((row) => row.nationalIdNumber))];
    const phones = [...new Set(validRows.map((row) => row.phone))];
    const usernames = teacherCodes.map((teacherCode) => buildTeacherUsername(teacherCode));

    const [
      existingTeachersByCode,
      existingTeachersByNationalId,
      existingTeachersByPhone,
      existingStudentsByNationalId,
      existingStudentsByPhone,
      existingUsersByUsername,
    ] = await Promise.all([
      Teacher.find({ teacherCode: { $in: teacherCodes } }).select('teacherCode').lean(),
      Teacher.find({ nationalIdNumber: { $in: nationalIds } }).select('nationalIdNumber').lean(),
      Teacher.find({ phone: { $in: phones } }).select('phone').lean(),
      Student.find({ nationalIdNumber: { $in: nationalIds } }).select('nationalIdNumber').lean(),
      Student.find({ phone: { $in: phones } }).select('phone').lean(),
      User.find({ username: { $in: usernames } }).select('username').lean(),
    ]);

    const existingTeacherCodeSet = new Set(existingTeachersByCode.map((item) => item.teacherCode));
    const existingTeacherNationalIdSet = new Set(existingTeachersByNationalId.map((item) => item.nationalIdNumber));
    const existingTeacherPhoneSet = new Set(existingTeachersByPhone.map((item) => item.phone));
    const existingStudentNationalIdSet = new Set(existingStudentsByNationalId.map((item) => item.nationalIdNumber));
    const existingStudentPhoneSet = new Set(existingStudentsByPhone.map((item) => item.phone));
    const existingUsernameSet = new Set(existingUsersByUsername.map((item) => item.username));

    const dbValidatedRows = [];

    validRows.forEach((row) => {
      if (existingTeacherCodeSet.has(row.teacherCode)) {
        errors.push({ rowNumber: row.rowNumber, message: 'Mã số giảng viên đã tồn tại trong hệ thống.' });
        return;
      }

      const duplicatedNationalId =
        existingTeacherNationalIdSet.has(row.nationalIdNumber) ||
        existingStudentNationalIdSet.has(row.nationalIdNumber);
      if (duplicatedNationalId) {
        errors.push({ rowNumber: row.rowNumber, message: 'CCCD đã tồn tại ở sinh viên hoặc giảng viên khác.' });
        return;
      }

      const duplicatedPhone =
        existingTeacherPhoneSet.has(row.phone) ||
        existingStudentPhoneSet.has(row.phone);
      if (duplicatedPhone) {
        errors.push({ rowNumber: row.rowNumber, message: 'Số điện thoại đã tồn tại ở sinh viên hoặc giảng viên khác.' });
        return;
      }

      if (existingUsernameSet.has(buildTeacherUsername(row.teacherCode))) {
        errors.push({ rowNumber: row.rowNumber, message: 'Tài khoản giảng viên đã tồn tại trong hệ thống.' });
        return;
      }

      dbValidatedRows.push(row);
    });

    return {
      totalRows: records.length,
      validRows: dbValidatedRows,
      errors,
    };
  }

  return {
    totalRows: records.length,
    validRows,
    errors,
  };
};

const batchCreateTeachersFromValidated = async (validRows) => {
  const createdRows = [];
  const errors = [];

  for (const item of validRows) {
    try {
      const payload = normalizeTeacherPayload(item);
      const validationMessage = validateTeacherPayload(payload);
      if (validationMessage) {
        errors.push({
          rowNumber: item.rowNumber || null,
          message: validationMessage,
        });
        continue;
      }

      const teacher = await createTeacher(payload);
      createdRows.push({
        rowNumber: item.rowNumber || null,
        teacherId: teacher._id,
        teacherCode: teacher.teacherCode,
        fullName: teacher.fullName,
      });
    } catch (error) {
      const message =
        error.status === 409
          ? error.message
          : error.code === 11000
            ? getDuplicateKeyMessage(error)
            : 'Lỗi server khi thêm giảng viên.';

      errors.push({ rowNumber: item.rowNumber || null, message });
    }
  }

  return { createdRows, errors };
};

const importTeachersFromCsv = async (fileBuffer, fileMeta = {}) => {
  const { totalRows, validRows, errors: previewErrors } = await validateAndParseTeachersCsv(fileBuffer, fileMeta);
  const { createdRows, errors: commitErrors } = await batchCreateTeachersFromValidated(validRows);
  const errors = [...previewErrors, ...commitErrors];

  return {
    summary: {
      totalRows,
      createdRows: createdRows.length,
      failedRows: errors.length,
    },
    createdRows,
    errors,
  };
};

module.exports = {
  listTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  validateAndParseTeachersCsv,
  batchCreateTeachersFromValidated,
  importTeachersFromCsv,
};
