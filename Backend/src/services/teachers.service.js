const Teacher = require('../../Models/Teacher');
const User = require('../../Models/User');
const { buildTeacherUsername } = require('../utils/username');
const { checkDuplicateIdentityAcrossStudentsAndTeachers } = require('../utils/duplicateIdentity');
const { DEFAULT_ACCOUNT_PASSWORD } = require('../config/env');

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

module.exports = { listTeachers, getTeacherById, createTeacher, updateTeacher, deleteTeacher };
