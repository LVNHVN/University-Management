const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 0 },
    finalWeight: { type: Number, required: true, min: 0, max: 1 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Subject', subjectSchema);
