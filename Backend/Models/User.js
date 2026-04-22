const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'teacher', 'student'],
    },
    status: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

userSchema.pre('save', async function preSave() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

userSchema.pre('findOneAndUpdate', async function preFindOneAndUpdate() {
  const update = this.getUpdate() || {};
  const directPassword = update.password;
  const setPassword = update.$set?.password;

  if (directPassword) {
    update.password = await bcrypt.hash(directPassword, SALT_ROUNDS);
  }

  if (setPassword) {
    update.$set.password = await bcrypt.hash(setPassword, SALT_ROUNDS);
  }

  this.setUpdate(update);
});

module.exports = mongoose.model('User', userSchema);
