const Student = require('../../Models/Student');
const User = require('../../Models/User');
const Teacher = require('../../Models/Teacher');
const Curriculum = require('../../Models/Curriculum');
const { buildStudentUsername } = require('../utils/username');
const { checkDuplicateIdentityAcrossStudentsAndTeachers } = require('../utils/duplicateIdentity');
const { getDuplicateKeyMessage } = require('../utils/duplicateKey');
const { parseImportRecords } = require('../utils/importSpreadsheet');
const { DEFAULT_ACCOUNT_PASSWORD } = require('../config/env');
const { normalizeStudentPayload, validateStudentPayload } = require('../validators/students.validator');

const STUDENT_IMPORT_COLUMNS = [
  'studentCode',
  'fullName',
  'dob',
  'gender',
  'nationalIdNumber',
  'phone',
  'address',
  'curriculumCode',
  'academicYear',
];

const STUDENT_IMPORT_HEADERS_VI = [
  'Mã số sinh viên',
  'Họ và tên',
  'Ngày sinh',
  'Giới tính',
  'Số căn cước công dân',
  'Số điện thoại',
  'Địa chỉ',
  'Mã chương trình đào tạo',
  'Khóa học',
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

const resolveCurriculumById = async (curriculumId) => {
  const curriculum = await Curriculum.findById(curriculumId)
    .select('_id curriculumCode name')
    .lean();

  if (!curriculum) {
    const error = new Error('Chương trình đào tạo không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  return curriculum;
};

const listStudents = async (keyword) => {
  const filter = keyword
    ? {
        $or: [
          { studentCode: { $regex: keyword, $options: 'i' } },
          { fullName: { $regex: keyword, $options: 'i' } },
        ],
      }
    : {};

  return Student.find(filter)
    .sort({ studentCode: 1 })
    .select('studentCode fullName dob gender phone address major curriculumId academicYear nationalIdNumber userId')
    .populate('curriculumId', 'curriculumCode name');
};

const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .select('studentCode fullName dob gender phone address major curriculumId academicYear nationalIdNumber userId')
    .populate('curriculumId', 'curriculumCode name');

  if (!student) {
    const error = new Error('Không tìm thấy sinh viên.');
    error.status = 404;
    throw error;
  }

  return student;
};

const createStudent = async (payload) => {
  const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
    nationalIdNumber: payload.nationalIdNumber,
    phone: payload.phone,
  });

  if (duplicateIdentityMessage) {
    const error = new Error(duplicateIdentityMessage);
    error.status = 409;
    throw error;
  }

  const existingStudent = await Student.findOne({ studentCode: payload.studentCode });
  if (existingStudent) {
    const error = new Error('Mã số sinh viên đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const username = buildStudentUsername(payload.studentCode);
  const usernameExists = await User.findOne({ username });
  if (usernameExists) {
    const error = new Error('Tài khoản sinh viên đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const curriculum = await resolveCurriculumById(payload.curriculumId);

  const createdUser = await User.create({
    username,
    password: DEFAULT_ACCOUNT_PASSWORD,
    role: 'student',
    status: true,
  });

  try {
    const student = await Student.create({
      userId: createdUser._id,
      studentCode: payload.studentCode,
      fullName: payload.fullName,
      dob: payload.dob,
      gender: payload.gender,
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      address: payload.address,
      curriculumId: curriculum._id,
      major: curriculum.name,
      academicYear: payload.academicYear,
    });

    return student;
  } catch (err) {
    await User.findByIdAndDelete(createdUser._id);
    throw err;
  }
};

const updateStudent = async (id, payload) => {
  const existingStudent = await Student.findById(id).select('userId');

  if (!existingStudent) {
    const error = new Error('Không tìm thấy sinh viên.');
    error.status = 404;
    throw error;
  }

  const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
    nationalIdNumber: payload.nationalIdNumber,
    phone: payload.phone,
    excludeStudentId: id,
  });

  if (duplicateIdentityMessage) {
    const error = new Error(duplicateIdentityMessage);
    error.status = 409;
    throw error;
  }

  const expectedUsername = buildStudentUsername(payload.studentCode);
  const usernameExists = await User.findOne({
    username: expectedUsername,
    _id: { $ne: existingStudent.userId },
  }).select('_id').lean();

  if (usernameExists) {
    const error = new Error('Tên tài khoản sinh viên chuẩn đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const curriculum = await resolveCurriculumById(payload.curriculumId);

  const student = await Student.findByIdAndUpdate(
    id,
    {
      studentCode: payload.studentCode,
      fullName: payload.fullName,
      dob: payload.dob,
      gender: payload.gender,
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      address: payload.address,
      curriculumId: curriculum._id,
      major: curriculum.name,
      academicYear: payload.academicYear,
    },
    { new: true, runValidators: true }
  );

  await User.findByIdAndUpdate(existingStudent.userId, { username: expectedUsername }, { runValidators: true });

  return student;
};

const deleteStudent = async (id) => {
  const student = await Student.findByIdAndDelete(id);

  if (!student) {
    const error = new Error('Không tìm thấy sinh viên.');
    error.status = 404;
    throw error;
  }

  await User.findByIdAndDelete(student.userId);
};

const parseStudentsCsvBuffer = (fileBuffer, fileMeta = {}) => {
  const records = parseImportRecords(fileBuffer, fileMeta);

  if (!records.length) {
    const error = new Error('File import không có dữ liệu.');
    error.status = 400;
    throw error;
  }

  const firstRow = records[0] || {};
  const headersMatchByName = hasAllExpectedHeaders(firstRow, STUDENT_IMPORT_HEADERS_VI);

  if (!headersMatchByName) {
    const error = new Error(`File thiếu cột bắt buộc. Header chuẩn: ${STUDENT_IMPORT_HEADERS_VI.join(', ')}.`);
    error.status = 400;
    throw error;
  }

  return records.map((record) => mapRecordByHeaders(record, STUDENT_IMPORT_COLUMNS, STUDENT_IMPORT_HEADERS_VI));
};

const validateAndParseStudentsCsv = async (fileBuffer, fileMeta = {}) => {
  const records = parseStudentsCsvBuffer(fileBuffer, fileMeta);

  const errors = [];
  const validRows = [];
  const seenStudentCodes = new Map();
  const seenNationalIds = new Map();
  const seenPhones = new Map();
  const normalizedRows = records.map((row) => ({
    ...row,
    curriculumCode: String(row.curriculumCode || '').trim(),
  }));

  const curriculumCodes = [...new Set(normalizedRows.map((row) => row.curriculumCode).filter(Boolean))];
  const curricula = curriculumCodes.length
    ? await Curriculum.find({ curriculumCode: { $in: curriculumCodes } })
        .select('_id curriculumCode name')
        .lean()
    : [];
  const curriculumByCode = new Map(curricula.map((item) => [item.curriculumCode, item]));

  normalizedRows.forEach((row, index) => {
    const rowNumber = index + 2;
    const curriculum = curriculumByCode.get(row.curriculumCode);
    if (!curriculum) {
      errors.push({ rowNumber, message: 'Mã chương trình đào tạo không tồn tại trong hệ thống.' });
      return;
    }

    const payload = normalizeStudentPayload({ ...row, curriculumId: curriculum._id });
    const validationMessage = validateStudentPayload(payload);

    if (validationMessage) {
      errors.push({ rowNumber, message: validationMessage });
      return;
    }

    if (seenStudentCodes.has(payload.studentCode)) {
      errors.push({ rowNumber, message: `MSSV trùng với dòng ${seenStudentCodes.get(payload.studentCode)}.` });
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

    seenStudentCodes.set(payload.studentCode, rowNumber);
    seenNationalIds.set(payload.nationalIdNumber, rowNumber);
    seenPhones.set(payload.phone, rowNumber);
    validRows.push({
      rowNumber,
      ...payload,
      curriculumId: curriculum._id,
      curriculumCode: curriculum.curriculumCode,
      curriculumName: curriculum.name,
      major: curriculum.name,
    });
  });

  if (validRows.length > 0) {
    const studentCodes = [...new Set(validRows.map((row) => row.studentCode))];
    const nationalIds = [...new Set(validRows.map((row) => row.nationalIdNumber))];
    const phones = [...new Set(validRows.map((row) => row.phone))];
    const usernames = studentCodes.map((studentCode) => buildStudentUsername(studentCode));

    const [
      existingStudentsByCode,
      existingStudentsByNationalId,
      existingStudentsByPhone,
      existingTeachersByNationalId,
      existingTeachersByPhone,
      existingUsersByUsername,
    ] = await Promise.all([
      Student.find({ studentCode: { $in: studentCodes } }).select('studentCode').lean(),
      Student.find({ nationalIdNumber: { $in: nationalIds } }).select('nationalIdNumber').lean(),
      Student.find({ phone: { $in: phones } }).select('phone').lean(),
      Teacher.find({ nationalIdNumber: { $in: nationalIds } }).select('nationalIdNumber').lean(),
      Teacher.find({ phone: { $in: phones } }).select('phone').lean(),
      User.find({ username: { $in: usernames } }).select('username').lean(),
    ]);

    const existingStudentCodeSet = new Set(existingStudentsByCode.map((item) => item.studentCode));
    const existingStudentNationalIdSet = new Set(existingStudentsByNationalId.map((item) => item.nationalIdNumber));
    const existingStudentPhoneSet = new Set(existingStudentsByPhone.map((item) => item.phone));
    const existingTeacherNationalIdSet = new Set(existingTeachersByNationalId.map((item) => item.nationalIdNumber));
    const existingTeacherPhoneSet = new Set(existingTeachersByPhone.map((item) => item.phone));
    const existingUsernameSet = new Set(existingUsersByUsername.map((item) => item.username));

    const dbValidatedRows = [];

    validRows.forEach((row) => {
      if (existingStudentCodeSet.has(row.studentCode)) {
        errors.push({ rowNumber: row.rowNumber, message: 'Mã số sinh viên đã tồn tại trong hệ thống.' });
        return;
      }

      const duplicatedNationalId =
        existingStudentNationalIdSet.has(row.nationalIdNumber) ||
        existingTeacherNationalIdSet.has(row.nationalIdNumber);
      if (duplicatedNationalId) {
        errors.push({ rowNumber: row.rowNumber, message: 'CCCD đã tồn tại ở sinh viên hoặc giảng viên khác.' });
        return;
      }

      const duplicatedPhone =
        existingStudentPhoneSet.has(row.phone) ||
        existingTeacherPhoneSet.has(row.phone);
      if (duplicatedPhone) {
        errors.push({ rowNumber: row.rowNumber, message: 'Số điện thoại đã tồn tại ở sinh viên hoặc giảng viên khác.' });
        return;
      }

      if (existingUsernameSet.has(buildStudentUsername(row.studentCode))) {
        errors.push({ rowNumber: row.rowNumber, message: 'Tài khoản sinh viên đã tồn tại trong hệ thống.' });
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

const batchCreateStudentsFromValidated = async (validRows) => {
  const createdRows = [];
  const errors = [];

  for (const item of validRows) {
    try {
      const payload = normalizeStudentPayload(item);
      const validationMessage = validateStudentPayload(payload);
      if (validationMessage) {
        errors.push({
          rowNumber: item.rowNumber || null,
          message: validationMessage,
        });
        continue;
      }

      const student = await createStudent(payload);
      createdRows.push({
        rowNumber: item.rowNumber || null,
        studentId: student._id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        curriculumId: student.curriculumId,
      });
    } catch (error) {
      const message =
        error.status === 400 || error.status === 409
          ? error.message
          : error.code === 11000
            ? getDuplicateKeyMessage(error)
            : 'Lỗi server khi thêm sinh viên.';

      errors.push({ rowNumber: item.rowNumber || null, message });
    }
  }

  return { createdRows, errors };
};

const importStudentsFromCsv = async (fileBuffer, fileMeta = {}) => {
  const { totalRows, validRows, errors: previewErrors } = await validateAndParseStudentsCsv(fileBuffer, fileMeta);
  const { createdRows, errors: commitErrors } = await batchCreateStudentsFromValidated(validRows);
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
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  validateAndParseStudentsCsv,
  batchCreateStudentsFromValidated,
  importStudentsFromCsv,
};
