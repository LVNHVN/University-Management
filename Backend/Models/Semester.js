const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Semester', semesterSchema);
