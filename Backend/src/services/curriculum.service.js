const Curriculum = require('../../Models/Curriculum');
const Subject = require('../../Models/Subject');

const normalizeSubjectsWithCredits = async (subjects) => {
  if (!subjects.length) {
    return { totalCredits: 0 };
  }

  const subjectIds = subjects.map((s) => s.subjectId);
  const foundSubjects = await Subject.find({ _id: { $in: subjectIds } })
    .select('_id credits')
    .lean();

  if (foundSubjects.length !== subjectIds.length) {
    const error = new Error('Một số môn học được chọn không tồn tại trong hệ thống.');
    error.status = 400;
    throw error;
  }

  const totalCredits = foundSubjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);

  return { totalCredits };
};

const createCurriculum = async (payload) => {
  const existingCurriculum = await Curriculum.findOne({
    curriculumCode: payload.curriculumCode,
  }).select('_id').lean();

  if (existingCurriculum) {
    const error = new Error('Mã chương trình đào tạo đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  const { totalCredits } = await normalizeSubjectsWithCredits(subjects);

  return Curriculum.create({
    curriculumCode: payload.curriculumCode,
    name: payload.name,
    totalCredits,
    subjects,
  });
};

const listCurriculums = async (keyword) => {
  const filter = keyword
    ? {
        $or: [
          { curriculumCode: { $regex: keyword, $options: 'i' } },
          { name: { $regex: keyword, $options: 'i' } },
        ],
      }
    : {};

  const curriculums = await Curriculum.find(filter)
    .sort({ curriculumCode: 1, _id: 1 })
    .lean();

  return curriculums.map((curriculum) => ({
    _id: curriculum._id,
    curriculumCode: curriculum.curriculumCode,
    name: curriculum.name,
    totalCredits: Number.isFinite(curriculum.totalCredits) ? curriculum.totalCredits : 0,
  }));
};

const getCurriculumDetail = async (id) => {
  const curriculum = await Curriculum.findById(id)
    .populate('subjects.subjectId', 'subjectCode name credits')
    .lean();

  if (!curriculum) {
    const error = new Error('Không tìm thấy chương trình đào tạo.');
    error.status = 404;
    throw error;
  }

  return {
    _id: curriculum._id,
    curriculumCode: curriculum.curriculumCode,
    name: curriculum.name,
    totalCredits: Number.isFinite(curriculum.totalCredits) ? curriculum.totalCredits : 0,
    subjects: Array.isArray(curriculum.subjects)
      ? curriculum.subjects
          .filter((item) => item.subjectId)
          .map((item) => ({
            subjectId: item.subjectId._id,
            subjectCode: item.subjectId.subjectCode,
            name: item.subjectId.name,
            credits: item.subjectId.credits,
            recommendedSemester: item.recommendedSemester,
          }))
      : [],
  };
};

const updateCurriculum = async (id, payload) => {
  const curriculum = await Curriculum.findById(id).select('_id curriculumCode').lean();

  if (!curriculum) {
    const error = new Error('Không tìm thấy chương trình đào tạo.');
    error.status = 404;
    throw error;
  }

  const existingByCode = await Curriculum.findOne({
    curriculumCode: payload.curriculumCode,
    _id: { $ne: id },
  })
    .select('_id')
    .lean();

  if (existingByCode) {
    const error = new Error('Mã chương trình đào tạo đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const subjects = Array.isArray(payload.subjects) ? payload.subjects : [];
  const { totalCredits } = await normalizeSubjectsWithCredits(subjects);

  const updated = await Curriculum.findByIdAndUpdate(
    id,
    {
      curriculumCode: payload.curriculumCode,
      name: payload.name,
      subjects,
      totalCredits,
    },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  return {
    _id: updated._id,
    curriculumCode: updated.curriculumCode,
    name: updated.name,
    totalCredits: Number.isFinite(updated.totalCredits) ? updated.totalCredits : 0,
  };
};

const deleteCurriculum = async (id) => {
  const curriculum = await Curriculum.findByIdAndDelete(id);

  if (!curriculum) {
    const error = new Error('Không tìm thấy chương trình đào tạo.');
    error.status = 404;
    throw error;
  }
};

module.exports = {
  listCurriculums,
  createCurriculum,
  getCurriculumDetail,
  updateCurriculum,
  deleteCurriculum,
};