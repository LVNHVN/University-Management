const Semester = require('../../Models/Semester');
const { compareSemester } = require('../utils/semester');

const normalizeSemesterDetail = (semester) => ({
  _id: semester._id,
  code: semester.code,
  name: semester.name,
  startDate: semester.startDate,
  endDate: semester.endDate,
});

const listSemesters = async (keyword) => {
  const filter = keyword
    ? {
        $or: [
          { code: { $regex: keyword, $options: 'i' } },
          { name: { $regex: keyword, $options: 'i' } },
        ],
      }
    : {};

  const semesters = await Semester.find(filter).lean();

  return semesters
    .sort((a, b) => compareSemester(a.code, b.code))
    .map(normalizeSemesterDetail);
};

const getSemesterDetail = async (id) => {
  const semester = await Semester.findById(id).lean();

  if (!semester) {
    const error = new Error('Không tìm thấy học kỳ.');
    error.status = 404;
    throw error;
  }

  return normalizeSemesterDetail(semester);
};

const createSemester = async (payload) => {
  const existing = await Semester.findOne({ code: payload.code }).select('_id').lean();

  if (existing) {
    const error = new Error('Mã học kỳ đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const created = await Semester.create({
    code: payload.code,
    name: payload.name,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  return normalizeSemesterDetail(created.toObject());
};

const updateSemester = async (id, payload) => {
  const semester = await Semester.findById(id).select('_id code').lean();

  if (!semester) {
    const error = new Error('Không tìm thấy học kỳ.');
    error.status = 404;
    throw error;
  }

  const updated = await Semester.findByIdAndUpdate(
    id,
    {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
    },
    { new: true, runValidators: true }
  ).lean();

  return normalizeSemesterDetail(updated);
};

const ensureSemesterExists = async (code) => {
  const semester = await Semester.findOne({ code }).select('_id code').lean();

  if (!semester) {
    const error = new Error('Học kỳ không tồn tại trong hệ thống. Vui lòng chọn học kỳ hợp lệ.');
    error.status = 400;
    throw error;
  }

  return semester;
};

module.exports = {
  listSemesters,
  getSemesterDetail,
  createSemester,
  updateSemester,
  ensureSemesterExists,
};
