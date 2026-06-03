const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let connectPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(MONGO_URI)
      .then(() => {
        console.log('Đã kết nối thành công với MongoDB');
      })
      .catch((error) => {
        connectPromise = null;
        throw error;
      });
  }

  await connectPromise;
};

module.exports = connectDB;
