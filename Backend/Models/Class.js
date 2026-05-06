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
    studentCount: { type: Number, required: true, min: 0 },
    dayOfWeek: { type: Number, required: true, min: 1, max: 7 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Class', classSchema);
