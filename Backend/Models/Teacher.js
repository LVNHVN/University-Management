const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    teacherCode: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String, trim: true },
    nationalIdNumber: { type: String, unique: true, sparse: true, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    department: { type: String, trim: true },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Teacher', teacherSchema);
