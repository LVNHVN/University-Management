const Class = require('../../Models/Class');
const Subject = require('../../Models/Subject');
const Teacher = require('../../Models/Teacher');

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

  return Class.create({
    classCode: payload.classCode,
    subjectId: payload.subjectId,
    teacherId: payload.teacherId,
    semester: payload.semester,
    studentCount: payload.studentCount ?? 0,
    dayOfWeek: payload.dayOfWeek ?? null,
    startTime: payload.startTime || '',
    endTime: payload.endTime || '',
    room: payload.room || '',
  });
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
    .populate('subjectId', 'subjectCode name')
    .populate('teacherId', 'teacherCode fullName')
    .sort({ classCode: 1, _id: 1 })
    .lean();

  return classes.map((cls) => ({
    _id: cls._id,
    classCode: cls.classCode,
    semester: cls.semester,
    studentCount: cls.studentCount ?? 0,
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
    .populate('subjectId', 'subjectCode name credits')
    .populate('teacherId', 'teacherCode fullName department')
    .lean();

  if (!cls) {
    const error = new Error('Không tìm thấy lớp học.');
    error.status = 404;
    throw error;
  }

  return {
    _id: cls._id,
    classCode: cls.classCode,
    semester: cls.semester,
    studentCount: cls.studentCount ?? 0,
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

  const updated = await Class.findOneAndUpdate(
    { _id: id },
    {
      classCode: payload.classCode,
      subjectId: payload.subjectId,
      teacherId: payload.teacherId,
      semester: payload.semester,
      studentCount: payload.studentCount ?? 0,
      dayOfWeek: payload.dayOfWeek ?? null,
      startTime: payload.startTime || '',
      endTime: payload.endTime || '',
      room: payload.room || '',
    },
    { returnDocument: 'after' },
  ).lean();

  return updated;
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

module.exports = { createClass, listClasses, getClassDetail, updateClass, deleteClass };
