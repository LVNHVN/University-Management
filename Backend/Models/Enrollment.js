const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    gradeProcess: { type: Number, min: 0, max: 10 },
    gradeFinal: { type: Number, min: 0, max: 10 },
    gradeTotal10: { type: Number, min: 0, max: 10 },
    gradeTotal4: { type: Number, min: 0, max: 4 },
    gradeLetter: {
      type: String,
      enum: ['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F'],
    },
    note: { type: String, trim: true },
  },
  { versionKey: false }
);

enrollmentSchema.index({ studentId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
