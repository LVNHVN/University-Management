const Student = require('../../Models/Student');
const User = require('../../Models/User');
const { buildStudentUsername } = require('../utils/username');
const { checkDuplicateIdentityAcrossStudentsAndTeachers } = require('../utils/duplicateIdentity');
const { DEFAULT_ACCOUNT_PASSWORD } = require('../config/env');

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
    .select('studentCode fullName dob gender phone address major academicYear nationalIdNumber userId');
};

const getStudentById = async (id) => {
  const student = await Student.findById(id)
    .select('studentCode fullName dob gender phone address major academicYear nationalIdNumber userId');

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
      major: payload.major,
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
      major: payload.major,
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

module.exports = { listStudents, getStudentById, createStudent, updateStudent, deleteStudent };
