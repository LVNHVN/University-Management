const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true, trim: true },
    syllabus: {
      fileName: { type: String, default: '', trim: true },
      filePath: { type: String, default: '', trim: true },
      mimeType: { type: String, default: '', trim: true },
      fileSize: { type: Number, default: 0, min: 0 },
      uploadedAt: { type: Date, default: null },
    },
    credits: { type: Number, required: true, min: 0 },
    finalWeight: { type: Number, required: true, min: 0, max: 1 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Subject', subjectSchema);
