const Class = require('../../Models/Class');
const Subject = require('../../Models/Subject');
const Teacher = require('../../Models/Teacher');
const Enrollment = require('../../Models/Enrollment');
const Student = require('../../Models/Student');
const Semester = require('../../Models/Semester');
const { ensureSemesterExists } = require('./semester.service');
const { getLatestSemester, compareSemester } = require('../utils/semester');

const getSemesterCode = (semesterDoc, legacySemester = '') => {
  if (semesterDoc && typeof semesterDoc === 'object' && semesterDoc.code) {
    return semesterDoc.code;
  }

  if (typeof semesterDoc === 'string') {
    return semesterDoc;
  }

  return legacySemester || '';
};

const resolveTargetSemester = async (requestedSemester, semesters = []) => {

  if (!semesters.length) {
    return null;
  }

  if (requestedSemester) {
    const matched = semesters.find((semester) => semester.code === requestedSemester);
    if (matched) {
      return matched;
    }
  }

  const today = new Date();
  const activeSemester = semesters
    .filter((semester) => {
      if (!semester.startDate || !semester.endDate) {
        return false;
      }

      const startDate = new Date(semester.startDate);
      const endDate = new Date(semester.endDate);
      return startDate <= today && today <= endDate;
    })
    .sort((a, b) => compareSemester(a.code, b.code))
    .at(-1);

  if (activeSemester?.code) {
    return activeSemester;
  }

  const latestSemesterCode = getLatestSemester(semesters.map((semester) => semester.code));
  return semesters.find((semester) => semester.code === latestSemesterCode) || null;
};

const getMySchedule = async (userId, role, requestedSemester) => {
  if (role !== 'student') {
    const error = new Error('Bạn không có quyền xem lịch học cá nhân.');
    error.status = 403;
    throw error;
  }

  const student = await Student.findOne({ userId }).select('_id').lean();

  if (!student) {
    const error = new Error('Không tìm thấy hồ sơ sinh viên.');
    error.status = 404;
    throw error;
  }

  const semesters = await Semester.find()
    .select('code name startDate endDate')
    .lean();

  const targetSemester = await resolveTargetSemester(requestedSemester, semesters);
  const targetSemesterCode = targetSemester?.code || '';

  const enrollments = await Enrollment.find({ studentId: student._id })
    .populate({
      path: 'classId',
      select: 'classCode semesterId semester dayOfWeek startTime endTime room subjectId teacherId',
      populate: [
        { path: 'semesterId', select: 'code' },
        { path: 'subjectId', select: 'subjectCode name department credits finalWeight syllabus' },
        { path: 'teacherId', select: 'teacherCode fullName' },
      ],
    })
    .lean();

  const classes = enrollments
    .map((enrollment) => {
      const cls = enrollment.classId;

      if (!cls) {
        return null;
      }

      return {
        _id: cls._id,
        classCode: cls.classCode,
        semester: getSemesterCode(cls.semesterId, cls.semester),
        dayOfWeek: cls.dayOfWeek ?? null,
        startTime: cls.startTime || '',
        endTime: cls.endTime || '',
        room: cls.room || '',
        subject: cls.subjectId
          ? {
              _id: cls.subjectId._id,
              subjectCode: cls.subjectId.subjectCode,
              name: cls.subjectId.name,
              department: cls.subjectId.department || '',
              credits: cls.subjectId.credits,
              finalWeight: cls.subjectId.finalWeight,
              syllabus: cls.subjectId.syllabus || null,
            }
          : null,
        teacher: cls.teacherId
          ? {
              _id: cls.teacherId._id,
              teacherCode: cls.teacherId.teacherCode,
              fullName: cls.teacherId.fullName,
            }
          : null,
      };
    })
    .filter(Boolean)
    .filter((item) => {
      if (!targetSemesterCode) {
        return true;
      }

      return String(item.semester || '').trim() === targetSemesterCode;
    })
    .sort((a, b) => {
      const dayA = Number(a.dayOfWeek) || 99;
      const dayB = Number(b.dayOfWeek) || 99;

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      const startA = String(a.startTime || '');
      const startB = String(b.startTime || '');

      if (startA !== startB) {
        return startA.localeCompare(startB);
      }

      return String(a.classCode || '').localeCompare(String(b.classCode || ''));
    });

  return {
    semester: targetSemesterCode,
    semesterInfo: targetSemester
      ? {
          code: targetSemester.code,
          startDate: targetSemester.startDate,
          endDate: targetSemester.endDate,
        }
      : null,
    semesters: semesters
      .slice()
      .sort((a, b) => compareSemester(a.code, b.code))
      .map((semester) => ({
        code: semester.code,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
      })),
    classes,
  };
};

const createClass = async (payload) => {
  const existing = await Class.findOne({ classCode: payload.classCode }).select('_id').lean();

  if (existing) {
    const error = new Error('Mã lớp học đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const subject = await Subject.findById(payload.subjectId).select('_id').lean();

  if (!subject) {
    const error = new Error('Môn học không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  const teacher = await Teacher.findById(payload.teacherId).select('_id').lean();

  if (!teacher) {
    const error = new Error('Giảng viên không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  const semester = await ensureSemesterExists(payload.semester);

  const created = await Class.create({
    classCode: payload.classCode,
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
    semesterId: semester._id,
    studentCount: 0,
    dayOfWeek: payload.dayOfWeek ?? null,
    startTime: payload.startTime || '',
    endTime: payload.endTime || '',
    room: payload.room || '',
  });

  const populated = await Class.findById(created._id).populate('semesterId', 'code').lean();

  return {
    ...populated,
    semester: getSemesterCode(populated?.semesterId, populated?.semester),
  };
};

const listClasses = async (keyword) => {
  let filter = {};

  if (keyword) {
    const matchingSubjects = await Subject.find({
      $or: [
        { subjectCode: { $regex: keyword, $options: 'i' } },
        { name: { $regex: keyword, $options: 'i' } },
      ],
    })
      .select('_id')
      .lean();

    const matchingSubjectIds = matchingSubjects.map((s) => s._id);

    filter = {
      $or: [
        { classCode: { $regex: keyword, $options: 'i' } },
        { subjectId: { $in: matchingSubjectIds } },
      ],
    };
  }

  const classes = await Class.find(filter)
    .populate('semesterId', 'code')
    .populate('subjectId', 'subjectCode name')
    .populate('teacherId', 'teacherCode fullName')
    .sort({ classCode: 1, _id: 1 })
    .lean();

  // Get actual student counts from Enrollment
  const classIds = classes.map((c) => c._id);
  const enrollmentCounts = await Enrollment.aggregate([
    { $match: { classId: { $in: classIds } } },
    { $group: { _id: '$classId', count: { $sum: 1 } } },
  ]);

  const countMap = {};
  enrollmentCounts.forEach((item) => {
    countMap[item._id.toString()] = item.count;
  });

  return classes.map((cls) => ({
    _id: cls._id,
    classCode: cls.classCode,
    semester: getSemesterCode(cls.semesterId, cls.semester),
    studentCount: countMap[cls._id.toString()] ?? 0,
    dayOfWeek: cls.dayOfWeek ?? null,
    startTime: cls.startTime || '',
    endTime: cls.endTime || '',
    room: cls.room || '',
    subject: cls.subjectId
      ? {
          _id: cls.subjectId._id,
          subjectCode: cls.subjectId.subjectCode,
          name: cls.subjectId.name,
        }
      : null,
    teacher: cls.teacherId
      ? {
          _id: cls.teacherId._id,
          teacherCode: cls.teacherId.teacherCode,
          fullName: cls.teacherId.fullName,
        }
      : null,
  }));
};

const getClassDetail = async (id) => {
  const cls = await Class.findById(id)
    .populate('semesterId', 'code')
    .populate('subjectId', 'subjectCode name credits')
    .populate('teacherId', 'teacherCode fullName department')
    .lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  // Calculate actual student count from Enrollment
  const actualStudentCount = await Enrollment.countDocuments({ classId: id });

  return {
    _id: cls._id,
    classCode: cls.classCode,
    semester: getSemesterCode(cls.semesterId, cls.semester),
    studentCount: actualStudentCount,
    dayOfWeek: cls.dayOfWeek ?? null,
    startTime: cls.startTime || '',
    endTime: cls.endTime || '',
    room: cls.room || '',
    subject: cls.subjectId
      ? {
          _id: cls.subjectId._id,
          subjectCode: cls.subjectId.subjectCode,
          name: cls.subjectId.name,
          credits: cls.subjectId.credits,
        }
      : null,
    teacher: cls.teacherId
      ? {
          _id: cls.teacherId._id,
          teacherCode: cls.teacherId.teacherCode,
          fullName: cls.teacherId.fullName,
          department: cls.teacherId.department,
        }
      : null,
  };
};

const updateClass = async (id, payload) => {
  const cls = await Class.findById(id).select('_id classCode').lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  if (payload.classCode !== cls.classCode) {
    const existing = await Class.findOne({ classCode: payload.classCode, _id: { $ne: id } })
      .select('_id')
      .lean();

    if (existing) {
      const error = new Error('Mã lớp học đã tồn tại.');
      error.status = 409;
      throw error;
    }
  }

  const subject = await Subject.findById(payload.subjectId).select('_id').lean();

  if (!subject) {
    const error = new Error('Môn học không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  const teacher = await Teacher.findById(payload.teacherId).select('_id').lean();

  if (!teacher) {
    const error = new Error('Giảng viên không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  const semester = await ensureSemesterExists(payload.semester);

  const updated = await Class.findOneAndUpdate(
    { _id: id },
    {
      classCode: payload.classCode,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      semesterId: semester._id,
      dayOfWeek: payload.dayOfWeek ?? null,
      startTime: payload.startTime || '',
      endTime: payload.endTime || '',
      room: payload.room || '',
    },
    { returnDocument: 'after' },
  )
    .populate('semesterId', 'code')
    .lean();

  return {
    ...updated,
    semester: getSemesterCode(updated.semesterId, updated.semester),
  };
};

const deleteClass = async (id) => {
  const cls = await Class.findByIdAndDelete(id).lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  return cls;
};

const getClassStudents = async (classId) => {
  const cls = await Class.findById(classId).select('_id classCode').lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  const enrollments = await Enrollment.find({ classId })
    .populate({
      path: 'studentId',
      select: 'studentCode fullName major academicYear userId',
    })
    .sort({ 'studentId.studentCode': 1 })
    .lean();

  const students = enrollments
    .map((enrollment) => {
      if (!enrollment.studentId) {
        return null;
      }

      return {
        _id: enrollment.studentId._id,
        studentCode: enrollment.studentId.studentCode,
        fullName: enrollment.studentId.fullName,
        major: enrollment.studentId.major || '',
        academicYear: enrollment.studentId.academicYear || '',
        enrollmentId: enrollment._id,
        gradeProcess: enrollment.gradeProcess ?? null,
        gradeFinal: enrollment.gradeFinal ?? null,
      };
    })
    .filter(Boolean);

  return {
    classId: cls._id,
    classCode: cls.classCode,
    studentCount: students.length,
    students,
  };
};

module.exports = {
  createClass,
  listClasses,
  getClassDetail,
  updateClass,
  deleteClass,
  getClassStudents,
  getMySchedule,
};
