const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema(
  {
    curriculumCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    totalCredits: { type: Number, required: true, min: 0, default: 0 },
    subjects: [
      {
        subjectId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Subject',
          required: true,
        },
        recommendedSemester: { type: Number, min: 1 },
      },
    ],
  },
  { versionKey: false }
);

module.exports = mongoose.model('Curriculum', curriculumSchema);
