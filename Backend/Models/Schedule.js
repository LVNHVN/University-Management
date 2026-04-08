const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema(
  {
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true,
    },
    studyDate: { type: Date, required: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Schedule', scheduleSchema);
