const Student = require('../../Models/Student');
const Teacher = require('../../Models/Teacher');

const checkDuplicateIdentityAcrossStudentsAndTeachers = async ({
  nationalIdNumber,
  phone,
  excludeStudentId,
  excludeTeacherId,
}) => {
  const studentFilter = {};
  const teacherFilter = {};

  if (excludeStudentId) {
    studentFilter._id = { $ne: excludeStudentId };
  }

  if (excludeTeacherId) {
    teacherFilter._id = { $ne: excludeTeacherId };
  }

  const [studentByNationalId, teacherByNationalId] = await Promise.all([
    Student.findOne({ ...studentFilter, nationalIdNumber }).select('_id').lean(),
    Teacher.findOne({ ...teacherFilter, nationalIdNumber }).select('_id').lean(),
  ]);

  if (studentByNationalId || teacherByNationalId) {
    return 'CCCD đã tồn tại ở sinh viên hoặc giảng viên khác.';
  }

  const [studentByPhone, teacherByPhone] = await Promise.all([
    Student.findOne({ ...studentFilter, phone }).select('_id').lean(),
    Teacher.findOne({ ...teacherFilter, phone }).select('_id').lean(),
  ]);

  if (studentByPhone || teacherByPhone) {
    return 'Số điện thoại đã tồn tại ở sinh viên hoặc giảng viên khác.';
  }

  return '';
};

module.exports = { checkDuplicateIdentityAcrossStudentsAndTeachers };
