const Class = require('../../Models/Class');
const Subject = require('../../Models/Subject');
const Teacher = require('../../Models/Teacher');
const Enrollment = require('../../Models/Enrollment');
const Student = require('../../Models/Student');
const Semester = require('../../Models/Semester');
const Schedule = require('../../Models/Schedule');
const Attendance = require('../../Models/Attendance');
const { createNotification } = require('./notifications.service');
const { parseImportRecords } = require('../utils/importSpreadsheet');
const { ensureSemesterExists } = require('./semester.service');
const { getLatestSemester, compareSemester } = require('../utils/semester');

const normalizeImportText = (value = '') => String(value || '')
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '');

const parseScoreValue = (value) => {
  if (value == null || value === '') {
    return null;
  }

  const score = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(score) ? score : null;
};

const isHalfStepScore = (score) => Number.isFinite(score) && Math.abs((score * 2) - Math.round(score * 2)) < 1e-9;

const toDisplayDmy = (ymd) => {
  const text = String(ymd || '').trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return text;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
};

const parseYmdToDayRange = (value) => {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const error = new Error('Ngày điểm danh không hợp lệ (định dạng YYYY-MM-DD).');
    error.status = 400;
    throw error;
  }

  const start = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    const error = new Error('Ngày điểm danh không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { text, start, end };
};

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

const computeGradeLetter = (totalScore) => {
  if (!Number.isFinite(totalScore) || totalScore < 0 || totalScore > 10) {
    return '';
  }

  if (totalScore < 4.0) {
    return 'F';
  }

  if (totalScore < 5.0) {
    return 'D';
  }

  if (totalScore < 5.5) {
    return 'D+';
  }

  if (totalScore < 6.5) {
    return 'C';
  }

  if (totalScore < 7.0) {
    return 'C+';
  }

  if (totalScore < 8.0) {
    return 'B';
  }

  if (totalScore < 8.5) {
    return 'B+';
  }

  if (totalScore < 9.5) {
    return 'A';
  }

  return 'A+';
};

const toGradePoint4 = (totalScore) => {
  const letter = computeGradeLetter(totalScore);

  switch (letter) {
    case 'A+':
    case 'A':
      return 4;
    case 'B+':
      return 3.5;
    case 'B':
      return 3;
    case 'C+':
      return 2.5;
    case 'C':
      return 2;
    case 'D+':
      return 1.5;
    case 'D':
      return 1;
    case 'F':
      return 0;
    default:
      return null;
  }
};

const getMySchedule = async (userId, role, requestedSemester) => {
  if (role !== 'student' && role !== 'teacher') {
    const error = new Error('Bạn không có quyền xem lịch cá nhân.');
    error.status = 403;
    throw error;
  }

  const semesters = await Semester.find()
    .select('code name startDate endDate')
    .lean();

  const targetSemester = await resolveTargetSemester(requestedSemester, semesters);
  const targetSemesterCode = targetSemester?.code || '';

  let rawClasses = [];

  if (role === 'student') {
    const student = await Student.findOne({ userId }).select('_id').lean();

    if (!student) {
      const error = new Error('Không tìm thấy hồ sơ sinh viên.');
      error.status = 404;
      throw error;
    }

    const enrollments = await Enrollment.find({ studentId: student._id })
      .populate({
        path: 'classId',
        select: 'classCode semesterId semester studentCount dayOfWeek startTime endTime room subjectId teacherId',
        populate: [
          { path: 'semesterId', select: 'code' },
          { path: 'subjectId', select: 'subjectCode name department credits finalWeight syllabus' },
          { path: 'teacherId', select: 'teacherCode fullName' },
        ],
      })
      .lean();

    rawClasses = enrollments.map((enrollment) => enrollment.classId).filter(Boolean);
  }

  if (role === 'teacher') {
    const teacher = await Teacher.findOne({ userId }).select('_id').lean();

    if (!teacher) {
      const error = new Error('Không tìm thấy hồ sơ giảng viên.');
      error.status = 404;
      throw error;
    }

    rawClasses = await Class.find({ teacherId: teacher._id })
      .select('classCode semesterId semester studentCount dayOfWeek startTime endTime room subjectId teacherId')
      .populate('semesterId', 'code')
      .populate('subjectId', 'subjectCode name department credits finalWeight syllabus')
      .populate('teacherId', 'teacherCode fullName')
      .lean();
  }

  const classIds = rawClasses
    .map((item) => item?._id)
    .filter(Boolean);

  const enrollmentCounts = classIds.length
    ? await Enrollment.aggregate([
      { $match: { classId: { $in: classIds } } },
      { $group: { _id: '$classId', count: { $sum: 1 } } },
    ])
    : [];

  const studentCountByClassId = new Map(
    enrollmentCounts.map((item) => [String(item._id), Number(item.count) || 0]),
  );

  const classes = rawClasses
    .map((cls) => ({
      _id: cls._id,
      classCode: cls.classCode,
      semester: getSemesterCode(cls.semesterId, cls.semester),
      studentCount: studentCountByClassId.get(String(cls._id)) ?? 0,
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
    }))
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

const getMyGrades = async (userId, requestedSemester) => {
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
      select: 'classCode semesterId semester subjectId',
      populate: [
        { path: 'semesterId', select: 'code' },
        { path: 'subjectId', select: 'subjectCode name credits finalWeight' },
      ],
    })
    .lean();

  const grades = enrollments
    .map((enrollment) => {
      const cls = enrollment.classId;
      if (!cls || !cls.subjectId) {
        return null;
      }

      const semesterCode = getSemesterCode(cls.semesterId, cls.semester);
      if (targetSemesterCode && semesterCode !== targetSemesterCode) {
        return null;
      }

      const processScore = Number.isFinite(enrollment.gradeProcess) ? enrollment.gradeProcess : null;
      const finalScore = Number.isFinite(enrollment.gradeFinal) ? enrollment.gradeFinal : null;
      const finalWeight = Number.isFinite(cls.subjectId.finalWeight) ? cls.subjectId.finalWeight : null;
      const processWeight = Number.isFinite(finalWeight) ? (1 - finalWeight) : null;

      const totalScore = processScore != null && finalScore != null && finalWeight != null && processWeight != null
        ? Number((processScore * processWeight + finalScore * finalWeight).toFixed(2))
        : null;

      const gradeLetter = totalScore != null ? computeGradeLetter(totalScore) : '';

      return {
        enrollmentId: enrollment._id,
        classId: cls._id,
        semester: semesterCode,
        classCode: cls.classCode || '',
        subject: {
          _id: cls.subjectId._id,
          subjectCode: cls.subjectId.subjectCode || '',
          name: cls.subjectId.name || '',
          credits: cls.subjectId.credits,
        },
        gradeProcess: processScore,
        gradeFinal: finalScore,
        gradeTotal: totalScore,
        gradeLetter,
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      const byCode = String(a.subject?.subjectCode || '').localeCompare(String(b.subject?.subjectCode || ''));
      if (byCode !== 0) {
        return byCode;
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
    grades,
  };
};

const getMyGradeSummary = async (userId) => {
  const student = await Student.findOne({ userId }).select('_id').lean();

  if (!student) {
    const error = new Error('Không tìm thấy hồ sơ sinh viên.');
    error.status = 404;
    throw error;
  }

  const enrollments = await Enrollment.find({ studentId: student._id })
    .populate({
      path: 'classId',
      select: 'semesterId semester subjectId',
      populate: [
        { path: 'semesterId', select: 'code name' },
        { path: 'subjectId', select: 'credits finalWeight' },
      ],
    })
    .lean();

  const semesterBuckets = new Map();

  enrollments.forEach((enrollment) => {
    const cls = enrollment.classId;
    if (!cls) {
      return;
    }

    const semesterCode = getSemesterCode(cls.semesterId, cls.semester);
    if (!semesterCode) {
      return;
    }

    const semesterName = cls?.semesterId?.name || semesterCode;
    if (!semesterBuckets.has(semesterCode)) {
      semesterBuckets.set(semesterCode, {
        semester: semesterCode,
        semesterName,
        qualityPoints: 0,
        attemptedCredits: 0,
        earnedCredits: 0,
        hasIncompleteDetail: false,
      });
    }

    const bucket = semesterBuckets.get(semesterCode);
    const subject = cls?.subjectId;

    if (!subject) {
      bucket.hasIncompleteDetail = true;
      return;
    }

    const processScore = Number.isFinite(enrollment.gradeProcess) ? enrollment.gradeProcess : null;
    const finalScore = Number.isFinite(enrollment.gradeFinal) ? enrollment.gradeFinal : null;
    const finalWeight = Number.isFinite(subject.finalWeight) ? subject.finalWeight : null;
    const processWeight = Number.isFinite(finalWeight) ? (1 - finalWeight) : null;
    const credits = Number.isFinite(subject.credits) ? Number(subject.credits) : 0;

    if (processScore == null || finalScore == null || finalWeight == null || processWeight == null || credits <= 0) {
      bucket.hasIncompleteDetail = true;
      return;
    }

    const totalScore = Number((processScore * processWeight + finalScore * finalWeight).toFixed(2));
    const point4 = toGradePoint4(totalScore);

    if (point4 == null) {
      bucket.hasIncompleteDetail = true;
      return;
    }

    bucket.qualityPoints += point4 * credits;
    bucket.attemptedCredits += credits;
    if (totalScore >= 4.0) {
      bucket.earnedCredits += credits;
    }
  });

  const chronological = Array.from(semesterBuckets.values())
    .sort((a, b) => compareSemester(a.semester, b.semester));

  let cumulativeQualityPoints = 0;
  let cumulativeCredits = 0;
  let cumulativeEarnedCredits = 0;

  const withCumulative = chronological.map((item) => {
    const hasFullSemesterDetail = !item.hasIncompleteDetail && item.attemptedCredits > 0;
    if (!hasFullSemesterDetail) {
      return {
        semester: item.semester,
        semesterName: item.semesterName,
        gpa: null,
        cpa: null,
        accumulatedCredits: null,
      };
    }

    const gpa = item.attemptedCredits > 0
      ? Number((item.qualityPoints / item.attemptedCredits).toFixed(2))
      : null;

    cumulativeQualityPoints += item.qualityPoints;
    cumulativeCredits += item.attemptedCredits;
    cumulativeEarnedCredits += item.earnedCredits;

    const cpa = cumulativeCredits > 0
      ? Number((cumulativeQualityPoints / cumulativeCredits).toFixed(2))
      : null;

    return {
      semester: item.semester,
      semesterName: item.semesterName,
      gpa,
      cpa,
      accumulatedCredits: cumulativeEarnedCredits,
    };
  });

  const summaries = withCumulative.sort((a, b) => compareSemester(b.semester, a.semester));

  return {
    summaries,
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
  const cls = await Class.findById(classId)
    .select('_id classCode subjectId')
    .populate('subjectId', 'finalWeight')
    .lean();

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
    subjectFinalWeight: Number.isFinite(cls?.subjectId?.finalWeight) ? cls.subjectId.finalWeight : null,
    studentCount: students.length,
    students,
  };
};

const updateStudentGrades = async (classId, enrollmentId, payload = {}) => {
  const enrollment = await Enrollment.findOne({ _id: enrollmentId, classId }).lean();

  if (!enrollment) {
    const error = new Error('Không tìm thấy đăng ký học của sinh viên trong lớp này.');
    error.status = 404;
    throw error;
  }

  const toNullableScore = (value) => {
    if (value === '' || value == null) {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  };

  const gradeProcess = toNullableScore(payload.gradeProcess);
  const gradeFinal = toNullableScore(payload.gradeFinal);
  const isHalfStep = (score) => Number.isFinite(score) && Math.abs((score * 2) - Math.round(score * 2)) < 1e-9;

  if (gradeProcess != null && (!Number.isFinite(gradeProcess) || gradeProcess < 0 || gradeProcess > 10)) {
    const error = new Error('Điểm quá trình phải trong khoảng từ 0 đến 10.');
    error.status = 400;
    throw error;
  }

  if (gradeProcess != null && !isHalfStep(gradeProcess)) {
    const error = new Error('Điểm quá trình chỉ được nhập theo bước 0.5.');
    error.status = 400;
    throw error;
  }

  if (gradeFinal != null && (!Number.isFinite(gradeFinal) || gradeFinal < 0 || gradeFinal > 10)) {
    const error = new Error('Điểm cuối kỳ phải trong khoảng từ 0 đến 10.');
    error.status = 400;
    throw error;
  }

  if (gradeFinal != null && !isHalfStep(gradeFinal)) {
    const error = new Error('Điểm cuối kỳ chỉ được nhập theo bước 0.5.');
    error.status = 400;
    throw error;
  }

  const updated = await Enrollment.findOneAndUpdate(
    { _id: enrollmentId, classId },
    {
      gradeProcess,
      gradeFinal,
    },
    { returnDocument: 'after' },
  ).lean();

  return {
    enrollmentId: updated._id,
    gradeProcess: updated.gradeProcess,
    gradeFinal: updated.gradeFinal,
  };
};

const importClassGradesFromFile = async (classId, fileBuffer, fileMeta = {}) => {
  const cls = await Class.findById(classId).select('_id classCode').lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  const records = parseImportRecords(fileBuffer, fileMeta);

  if (!records.length) {
    const error = new Error('File import không có dữ liệu.');
    error.status = 400;
    throw error;
  }

  const headerAliases = {
    studentCode: ['MSSV', 'Mã số sinh viên', 'Mã SV'],
    fullName: ['Tên sinh viên', 'Họ tên', 'Họ và tên'],
    gradeProcess: ['Điểm quá trình', 'Điểm QT'],
    gradeFinal: ['Điểm cuối kỳ', 'Điểm CK'],
  };

  const normalizedHeaders = Object.keys(records[0] || {}).map((key) => normalizeImportText(key));

  const hasHeader = (aliases = []) => aliases
    .map((alias) => normalizeImportText(alias))
    .some((alias) => normalizedHeaders.includes(alias));

  if (!hasHeader(headerAliases.studentCode)
    || !hasHeader(headerAliases.fullName)
    || !hasHeader(headerAliases.gradeProcess)
    || !hasHeader(headerAliases.gradeFinal)) {
    const error = new Error('File thiếu cột bắt buộc. Header cần có: MSSV, Tên sinh viên, Điểm quá trình, Điểm cuối kỳ.');
    error.status = 400;
    throw error;
  }

  const resolveFieldValue = (row, aliases = []) => {
    const entries = Object.entries(row || {});
    const normalizedAliases = aliases.map((alias) => normalizeImportText(alias));
    const matched = entries.find(([key]) => normalizedAliases.includes(normalizeImportText(key)));
    return matched ? matched[1] : '';
  };

  const enrollments = await Enrollment.find({ classId })
    .populate({ path: 'studentId', select: 'studentCode fullName' })
    .lean();

  const enrollmentByStudentCode = new Map();

  enrollments.forEach((enrollment) => {
    if (!enrollment.studentId?.studentCode) {
      return;
    }

    enrollmentByStudentCode.set(
      String(enrollment.studentId.studentCode).trim().toUpperCase(),
      enrollment,
    );
  });

  const errors = [];
  const updates = [];
  const seenStudentCodes = new Map();

  records.forEach((row, index) => {
    const rowNumber = index + 2;
    const studentCodeRaw = resolveFieldValue(row, headerAliases.studentCode);
    const fullNameRaw = resolveFieldValue(row, headerAliases.fullName);
    const gradeProcessRaw = resolveFieldValue(row, headerAliases.gradeProcess);
    const gradeFinalRaw = resolveFieldValue(row, headerAliases.gradeFinal);

    const studentCode = String(studentCodeRaw || '').trim();
    const fullName = String(fullNameRaw || '').trim();
    const gradeProcess = parseScoreValue(gradeProcessRaw);
    const gradeFinal = parseScoreValue(gradeFinalRaw);

    if (!studentCode) {
      errors.push({ rowNumber, message: 'Thiếu MSSV.' });
      return;
    }

    if (!fullName) {
      errors.push({ rowNumber, message: 'Thiếu tên sinh viên.' });
      return;
    }

    if (gradeProcess == null || gradeFinal == null) {
      errors.push({ rowNumber, message: 'Thiếu điểm quá trình hoặc điểm cuối kỳ.' });
      return;
    }

    if (gradeProcess < 0 || gradeProcess > 10 || gradeFinal < 0 || gradeFinal > 10) {
      errors.push({ rowNumber, message: 'Điểm phải trong khoảng từ 0 đến 10.' });
      return;
    }

    if (!isHalfStepScore(gradeProcess) || !isHalfStepScore(gradeFinal)) {
      errors.push({ rowNumber, message: 'Điểm chỉ được nhập theo bước 0.5.' });
      return;
    }

    const normalizedCode = studentCode.toUpperCase();

    if (seenStudentCodes.has(normalizedCode)) {
      errors.push({ rowNumber, message: `MSSV trùng với dòng ${seenStudentCodes.get(normalizedCode)}.` });
      return;
    }

    seenStudentCodes.set(normalizedCode, rowNumber);

    const enrollment = enrollmentByStudentCode.get(normalizedCode);

    if (!enrollment) {
      errors.push({ rowNumber, message: 'MSSV không thuộc lớp học hiện tại.' });
      return;
    }

    const expectedName = normalizeImportText(enrollment.studentId?.fullName || '');
    if (normalizeImportText(fullName) !== expectedName) {
      errors.push({ rowNumber, message: 'Tên sinh viên không khớp với MSSV trong hệ thống.' });
      return;
    }

    updates.push({
      rowNumber,
      enrollmentId: enrollment._id,
      studentCode,
      fullName,
      gradeProcess,
      gradeFinal,
    });
  });

  const updatedRows = [];

  for (const updateItem of updates) {
    await Enrollment.updateOne(
      { _id: updateItem.enrollmentId, classId },
      {
        $set: {
          gradeProcess: updateItem.gradeProcess,
          gradeFinal: updateItem.gradeFinal,
        },
      },
    );

    updatedRows.push({
      rowNumber: updateItem.rowNumber,
      studentCode: updateItem.studentCode,
      fullName: updateItem.fullName,
      gradeProcess: updateItem.gradeProcess,
      gradeFinal: updateItem.gradeFinal,
    });
  }

  return {
    classId: cls._id,
    classCode: cls.classCode,
    summary: {
      totalRows: records.length,
      updatedRows: updatedRows.length,
      errorRows: errors.length,
    },
    updatedRows,
    errors,
  };
};

const getClassAttendanceByDate = async (classId, dateValue) => {
  const cls = await Class.findById(classId)
    .select('_id classCode dayOfWeek startTime endTime room')
    .lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  const { text: studyDate, start, end } = parseYmdToDayRange(dateValue);

  const enrollments = await Enrollment.find({ classId })
    .populate({ path: 'studentId', select: 'studentCode fullName' })
    .sort({ 'studentId.studentCode': 1 })
    .lean();

  const validEnrollments = enrollments.filter((item) => item.studentId);
  const studentIds = validEnrollments.map((item) => item.studentId._id);

  const schedule = await Schedule.findOne({
    classId,
    studyDate: { $gte: start, $lt: end },
  }).select('_id').lean();

  const attendanceRecords = schedule
    ? await Attendance.find({ scheduleId: schedule._id, studentId: { $in: studentIds } })
      .select('studentId status note')
      .lean()
    : [];

  const attendanceByStudentId = new Map(
    attendanceRecords.map((item) => [String(item.studentId), item]),
  );

  const students = validEnrollments.map((enrollment) => {
    const attendance = attendanceByStudentId.get(String(enrollment.studentId._id));
    return {
      studentId: enrollment.studentId._id,
      enrollmentId: enrollment._id,
      studentCode: enrollment.studentId.studentCode,
      fullName: enrollment.studentId.fullName,
      isPresent: attendance ? attendance.status !== 'Absent' : true,
      note: attendance?.note || '',
    };
  });

  return {
    classId: cls._id,
    classCode: cls.classCode,
    studyDate,
    scheduleId: schedule?._id || null,
    students,
  };
};

const updateClassAttendanceByDate = async (classId, dateValue, records = [], actorUserId = null) => {
  const cls = await Class.findById(classId)
    .select('_id classCode startTime endTime room subjectId')
    .populate('subjectId', 'subjectCode name')
    .lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  if (!Array.isArray(records)) {
    const error = new Error('Dữ liệu điểm danh không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const { text: studyDateText, start, end } = parseYmdToDayRange(dateValue);

  let schedule = await Schedule.findOne({
    classId,
    studyDate: { $gte: start, $lt: end },
  }).lean();

  if (!schedule) {
    const created = await Schedule.create({
      classId,
      studyDate: start,
      startTime: cls.startTime || '00:00',
      endTime: cls.endTime || '00:00',
      room: cls.room || 'TBA',
    });

    schedule = created.toObject();
  }

  const enrollments = await Enrollment.find({ classId })
    .populate({ path: 'studentId', select: '_id userId studentCode fullName' })
    .lean();

  const studentsById = new Map();

  enrollments.forEach((enrollment) => {
    if (!enrollment.studentId?._id) {
      return;
    }
    studentsById.set(String(enrollment.studentId._id), enrollment.studentId);
  });

  const normalizedRecords = [];

  records.forEach((record, index) => {
    const studentId = String(record?.studentId || '').trim();
    const isPresent = Boolean(record?.isPresent);
    const note = String(record?.note || '').trim();

    if (!studentId || !studentsById.has(studentId)) {
      const error = new Error(`Dòng điểm danh #${index + 1} không hợp lệ.`);
      error.status = 400;
      throw error;
    }

    normalizedRecords.push({ studentId, isPresent, note });
  });

  const previousAttendance = await Attendance.find({
    scheduleId: schedule._id,
    studentId: { $in: normalizedRecords.map((item) => item.studentId) },
  })
    .select('studentId status')
    .lean();

  const previousStatusByStudentId = new Map(
    previousAttendance.map((item) => [String(item.studentId), item.status]),
  );

  const newlyAbsentStudentIds = [];

  for (const record of normalizedRecords) {
    const previousStatus = previousStatusByStudentId.get(record.studentId);

    await Attendance.updateOne(
      { scheduleId: schedule._id, studentId: record.studentId },
      {
        $set: {
          status: record.isPresent ? 'Present' : 'Absent',
          note: record.note,
        },
      },
      { upsert: true },
    );

    if (!record.isPresent && previousStatus !== 'Absent') {
      newlyAbsentStudentIds.push(record.studentId);
    }
  }

  if (actorUserId && newlyAbsentStudentIds.length > 0) {
    const subjectName = cls?.subjectId?.name || cls?.subjectId?.subjectCode || 'môn học chưa cập nhật';
    const attendanceDateDisplay = toDisplayDmy(studyDateText);

    for (const studentId of newlyAbsentStudentIds) {
      const student = studentsById.get(String(studentId));

      if (!student?.userId) {
        continue;
      }

      await createNotification({
        title: 'Thông báo vắng mặt',
        content: `Bạn đã vắng mặt lớp ${cls.classCode} (${subjectName}) vào ngày ${attendanceDateDisplay}.`,
        targetRoles: ['student'],
        createdBy: actorUserId,
        recipientUserId: student.userId,
      });
    }
  }

  return {
    classId: cls._id,
    classCode: cls.classCode,
    studyDate: studyDateText,
    savedRows: normalizedRecords.length,
  };
};

module.exports = {
  createClass,
  listClasses,
  getClassDetail,
  updateClass,
  deleteClass,
  getClassStudents,
  updateStudentGrades,
  importClassGradesFromFile,
  getClassAttendanceByDate,
  updateClassAttendanceByDate,
  getMySchedule,
  getMyGrades,
  getMyGradeSummary,
};
