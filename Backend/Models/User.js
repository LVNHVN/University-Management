const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

function isBcryptHash(value) {
  return typeof value === 'string' && /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

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

userSchema.pre('save', async function preSave(next) {
  try {
    if (!this.isModified('password') || isBcryptHash(this.password)) {
      return next();
    }

    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    return next();
  } catch (error) {
    return next(error);
  }
});

userSchema.pre('findOneAndUpdate', async function preFindOneAndUpdate(next) {
  try {
    const update = this.getUpdate() || {};
    const directPassword = update.password;
    const setPassword = update.$set?.password;

    if (directPassword && !isBcryptHash(directPassword)) {
      update.password = await bcrypt.hash(directPassword, SALT_ROUNDS);
    }

    if (setPassword && !isBcryptHash(setPassword)) {
      update.$set.password = await bcrypt.hash(setPassword, SALT_ROUNDS);
    }

    this.setUpdate(update);
    return next();
  } catch (error) {
    return next(error);
  }
});

module.exports = mongoose.model('User', userSchema);
