const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./Models/User');

const MONGO_URI = process.env.MONGO_URI;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log("Đã kết nối thành công với MongoDB"))
  .catch((err) => console.log("Lỗi kết nối MongoDB: ", err));

app.get('/', (req, res) => {
  res.send('API Backend đang chạy!');
});

app.post('/api/verify-recaptcha', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Thiếu reCAPTCHA token.' });
  }

  try {
    const payload = new URLSearchParams({
      secret: RECAPTCHA_SECRET_KEY,
      response: token,
    });

    const googleResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    const data = await googleResponse.json();

    if (!data.success) {
      return res.status(400).json({
        success: false,
        message: 'Xác minh reCAPTCHA thất bại.',
        errors: data['error-codes'] || [],
      });
    }

    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi gọi Google reCAPTCHA API.',
    });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Thiếu username hoặc password.',
    });
  }

  try {
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu.',
      });
    }

    if (!user.status) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị khóa.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Sai tài khoản hoặc mật khẩu.',
      });
    }

    return res.json({
      success: true,
      user: {
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng nhập.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy ở port: ${PORT}`);
});