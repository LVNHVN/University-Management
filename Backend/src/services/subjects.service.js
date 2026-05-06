const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Subject = require('../../Models/Subject');

const SYLLABUS_UPLOAD_DIRECTORY = path.join(__dirname, '../../uploads/syllabi');
const SYLLABUS_PUBLIC_DIRECTORY = '/uploads/syllabi';

const createEmptySyllabus = () => ({
  fileName: '',
  filePath: '',
  mimeType: '',
  fileSize: 0,
  uploadedAt: null,
});

const resolveSyllabusDiskPath = (filePathValue = '') => {
  if (!filePathValue.startsWith(`${SYLLABUS_PUBLIC_DIRECTORY}/`)) {
    return '';
  }

  return path.join(SYLLABUS_UPLOAD_DIRECTORY, path.basename(filePathValue));
};

const removeSyllabusFile = async (syllabus = {}) => {
  const diskPath = resolveSyllabusDiskPath(String(syllabus.filePath || ''));

  if (!diskPath) {
    return;
  }

  try {
    await fs.unlink(diskPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
};

const storeSyllabusFile = async (file) => {
  if (!file) {
    return createEmptySyllabus();
  }

  await fs.mkdir(SYLLABUS_UPLOAD_DIRECTORY, { recursive: true });

  const extension = path.extname(String(file.originalname || '')).toLowerCase();
  const storedName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const absolutePath = path.join(SYLLABUS_UPLOAD_DIRECTORY, storedName);

  await fs.writeFile(absolutePath, file.buffer);

  return {
    fileName: String(file.originalname || '').trim(),
    filePath: `${SYLLABUS_PUBLIC_DIRECTORY}/${storedName}`,
    mimeType: String(file.mimetype || '').trim(),
    fileSize: Number(file.size || 0),
    uploadedAt: new Date(),
  };
};

const listSubjects = async (keyword) => {
  const filter = keyword
    ? {
        $or: [
          { subjectCode: { $regex: keyword, $options: 'i' } },
          { name: { $regex: keyword, $options: 'i' } },
        ],
      }
    : {};

  return Subject.find(filter)
    .sort({ subjectCode: 1 })
    .select('subjectCode name department syllabus credits finalWeight');
};

const getSubjectById = async (id) => {
  const subject = await Subject.findById(id)
    .select('subjectCode name department syllabus credits finalWeight');

  if (!subject) {
    const error = new Error('Không tìm thấy môn học.');
    error.status = 404;
    throw error;
  }

  return subject;
};

const createSubject = async (payload, syllabusFile) => {
  const existingSubject = await Subject.findOne({ subjectCode: payload.subjectCode }).select('_id').lean();

  if (existingSubject) {
    const error = new Error('Mã môn học đã tồn tại.');
    error.status = 409;
    throw error;
  }

  const syllabus = await storeSyllabusFile(syllabusFile);

  try {
    const subject = await Subject.create({
      subjectCode: payload.subjectCode,
      name: payload.name,
      department: payload.department,
      syllabus,
      credits: payload.credits,
      finalWeight: payload.finalWeight,
    });

    return subject;
  } catch (error) {
    await removeSyllabusFile(syllabus);
    throw error;
  }
};

const updateSubject = async (id, payload, options = {}) => {
  const existingSubject = await Subject.findById(id);

  if (!existingSubject) {
    const error = new Error('Không tìm thấy môn học.');
    error.status = 404;
    throw error;
  }

  let nextSyllabus = existingSubject.syllabus || createEmptySyllabus();
  let uploadedSyllabus = null;

  if (options.syllabusFile) {
    uploadedSyllabus = await storeSyllabusFile(options.syllabusFile);
    nextSyllabus = uploadedSyllabus;
  } else if (options.removeSyllabus) {
    nextSyllabus = createEmptySyllabus();
  }

  try {
    const subject = await Subject.findByIdAndUpdate(
      id,
      {
        subjectCode: payload.subjectCode,
        name: payload.name,
        department: payload.department,
        syllabus: nextSyllabus,
        credits: payload.credits,
        finalWeight: payload.finalWeight,
      },
      { new: true, runValidators: true }
    );

    if ((uploadedSyllabus || options.removeSyllabus) && existingSubject.syllabus?.filePath) {
      await removeSyllabusFile(existingSubject.syllabus);
    }

    return subject;
  } catch (error) {
    if (uploadedSyllabus) {
      await removeSyllabusFile(uploadedSyllabus);
    }

    throw error;
  }
};

const deleteSubject = async (id) => {
  const subject = await Subject.findByIdAndDelete(id);

  if (!subject) {
    const error = new Error('Không tìm thấy môn học.');
    error.status = 404;
    throw error;
  }

  await removeSyllabusFile(subject.syllabus);
};

module.exports = { listSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };
