const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Schedule',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['Present', 'Absent', 'Excused'],
    },
    note: { type: String, trim: true },
  },
  { versionKey: false }
);

attendanceSchema.index({ scheduleId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
