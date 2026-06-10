const mongoose = require('mongoose');

const tuitionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    semesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: true,
    },
    totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true },
    status: { type: String, required: true, enum: ['Paid', 'Unpaid', 'Transferred'] },
    transactionId: { type: String, trim: true },
    bankReference: { type: String, trim: true },
    paymentContent: { type: String, trim: true },
    qrIssuedAt: { type: Date },
    qrExpiresAt: { type: Date },
    paidAt: { type: Date },
  },
  { versionKey: false }
);

tuitionSchema.index({ studentId: 1, semesterId: 1 }, { unique: true });

module.exports = mongoose.model('Tuition', tuitionSchema);
