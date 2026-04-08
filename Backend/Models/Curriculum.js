const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema(
  {
    major: { type: String, required: true, trim: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    recommendedSemester: { type: Number, required: true, min: 1 },
  },
  { versionKey: false }
);

curriculumSchema.index({ major: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
