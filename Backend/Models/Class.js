const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    classCode: { type: String, required: true, unique: true, trim: true },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Teacher',
      required: true,
    },
    semester: { type: String, required: true, trim: true },
    studentCount: { type: Number, default: 0, min: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Class', classSchema);
