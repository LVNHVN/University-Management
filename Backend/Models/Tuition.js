const mongoose = require('mongoose');

const tuitionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    semester: { type: String, required: true, trim: true },
    totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    status: { type: String, required: true, enum: ['Paid', 'Unpaid'] },
    transactionId: { type: String, trim: true },
    paidAt: { type: Date },
  },
  { versionKey: false }
);

module.exports = mongoose.model('Tuition', tuitionSchema);
