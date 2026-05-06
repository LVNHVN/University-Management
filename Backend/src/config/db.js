const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

const connectDB = async () => {
  await mongoose.connect(MONGO_URI);

  console.log('Đã kết nối thành công với MongoDB');
};

module.exports = connectDB;
