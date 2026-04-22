const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('./Models/User');
const Student = require('./Models/Student');
const Teacher = require('./Models/Teacher');
const ClassModel = require('./Models/Class');
const Tuition = require('./Models/Tuition');

const MONGO_URI = process.env.MONGO_URI;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const PORT = process.env.PORT || 5000;
const DEFAULT_ACCOUNT_PASSWORD = '123456';

const buildStudentUsername = (studentCode) => `SV_${String(studentCode || '').trim()}`;
const buildTeacherUsername = (teacherCode) => `GV_${String(teacherCode || '').trim()}`;

const ensureAccountUsername = async ({ userId, expectedUsername }) => {
  const account = await User.findById(userId).select('username role status');

  if (!account) {
    const error = new Error('Không tìm thấy tài khoản.');
    error.status = 404;
    throw error;
  }

  if (account.username === expectedUsername) {
    return account;
  }

  const usernameExists = await User.findOne({
    username: expectedUsername,
    _id: { $ne: userId },
  }).select('_id').lean();

  if (usernameExists) {
    const error = new Error('Tên tài khoản chuẩn đã tồn tại ở tài khoản khác.');
    error.status = 409;
    throw error;
  }

  account.username = expectedUsername;
  await account.save();
  return account;
};

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

const compareSemester = (a, b) => {
  const [aYear = '0', aTerm = '0'] = String(a).split('.');
  const [bYear = '0', bTerm = '0'] = String(b).split('.');
  const yearDiff = Number(aYear) - Number(bYear);

  if (yearDiff !== 0) {
    return yearDiff;
  }

  return Number(aTerm) - Number(bTerm);
};

const getLatestSemester = (semesters = []) => {
  const cleaned = semesters.filter(Boolean);

  if (!cleaned.length) {
    const currentYear = new Date().getFullYear();
    return `${currentYear}.2`;
  }

  return cleaned.sort(compareSemester).at(-1);
};

app.get('/api/dashboard/overview', async (req, res) => {
  try {
    const [classSemesters, tuitionSemesters] = await Promise.all([
      ClassModel.distinct('semester'),
      Tuition.distinct('semester'),
    ]);

    const requestedSemester = String(req.query.semester || '').trim();
    const targetSemester = requestedSemester || getLatestSemester([...classSemesters, ...tuitionSemesters]);

    const [
      totalStudents,
      totalTeachers,
      totalOpenClasses,
      paidAmountResult,
      studentsByMajorResult,
      tuitionStatusResult,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      ClassModel.countDocuments({ semester: targetSemester }),
      Tuition.aggregate([
        {
          $match: {
            semester: targetSemester,
            status: 'Paid',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $toDouble: '$totalAmount' } },
          },
        },
      ]),
      Student.aggregate([
        {
          $group: {
            _id: {
              $cond: [
                {
                  $eq: [
                    {
                      $trim: {
                        input: { $ifNull: ['$major', ''] },
                      },
                    },
                    '',
                  ],
                },
                'Chưa xác định',
                {
                  $trim: {
                    input: { $ifNull: ['$major', ''] },
                  },
                },
              ],
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1, _id: 1 } },
      ]),
      Tuition.aggregate([
        { $match: { semester: targetSemester } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusCountMap = {
      Paid: 0,
      Unpaid: 0,
    };

    tuitionStatusResult.forEach((item) => {
      if (Object.hasOwn(statusCountMap, item._id)) {
        statusCountMap[item._id] = item.count;
      }
    });

    return res.json({
      success: true,
      semester: targetSemester,
      cards: {
        totalStudents,
        totalTeachers,
        totalOpenClasses,
        totalCollectedTuition: paidAmountResult[0]?.total || 0,
      },
      charts: {
        studentsByMajor: studentsByMajorResult.map((item) => ({
          major: item._id,
          count: item.count,
        })),
        tuitionStatus: [
          { status: 'Đã đóng', count: statusCountMap.Paid },
          { status: 'Chưa đóng', count: statusCountMap.Unpaid },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải dữ liệu tổng quan.',
    });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const filter = keyword
      ? {
          $or: [
            { studentCode: { $regex: keyword, $options: 'i' } },
            { fullName: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};

    const students = await Student.find(filter)
      .sort({ studentCode: 1 })
      .select('studentCode fullName dob gender phone address major academicYear nationalIdNumber userId');

    return res.json({
      success: true,
      students,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải danh sách sinh viên.',
    });
  }
});

app.get('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .select('studentCode fullName dob gender phone address major academicYear nationalIdNumber userId');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.',
      });
    }

    return res.json({
      success: true,
      student,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải chi tiết sinh viên.',
    });
  }
});

const normalizeStudentPayload = (body = {}) => ({
  studentCode: String(body.studentCode || '').trim(),
  fullName: String(body.fullName || '').trim(),
  dob: String(body.dob || '').trim(),
  gender: String(body.gender || '').trim(),
  nationalIdNumber: String(body.nationalIdNumber || '').trim(),
  phone: String(body.phone || '').trim(),
  address: String(body.address || '').trim(),
  major: String(body.major || '').trim(),
  academicYear: String(body.academicYear || '').trim(),
});

const validateStudentPayload = (payload) => {
  if (!payload.studentCode) {
    return 'Vui lòng nhập mã số sinh viên.';
  }

  if (!/^\d+$/.test(payload.studentCode)) {
    return 'Mã số sinh viên chỉ được nhập số.';
  }

  if (!payload.fullName) {
    return 'Vui lòng nhập họ và tên.';
  }

  if (!/^[\p{L}\s]+$/u.test(payload.fullName)) {
    return 'Họ và tên chỉ được nhập chữ.';
  }

  if (!payload.dob) {
    return 'Vui lòng nhập ngày sinh.';
  }

  if (Number.isNaN(new Date(payload.dob).getTime())) {
    return 'Ngày sinh không hợp lệ.';
  }

  if (!payload.gender) {
    return 'Vui lòng chọn giới tính.';
  }

  if (!['Nam', 'Nữ'].includes(payload.gender)) {
    return 'Giới tính chỉ được chọn Nam hoặc Nữ.';
  }

  if (!payload.nationalIdNumber) {
    return 'Vui lòng nhập CCCD.';
  }

  if (!/^\d{12}$/.test(payload.nationalIdNumber)) {
    return 'CCCD phải gồm đúng 12 số.';
  }

  if (!payload.phone) {
    return 'Vui lòng nhập số điện thoại.';
  }

  if (!/^\d{10}$/.test(payload.phone)) {
    return 'Số điện thoại phải gồm đúng 10 số.';
  }

  if (!payload.address) {
    return 'Vui lòng nhập địa chỉ.';
  }

  if (!payload.major) {
    return 'Vui lòng nhập ngành.';
  }

  if (!payload.academicYear) {
    return 'Vui lòng nhập khóa học.';
  }

  if (!/^\d+$/.test(payload.academicYear)) {
    return 'Khóa học chỉ được nhập số.';
  }

  return '';
};

const checkDuplicateIdentityAcrossStudentsAndTeachers = async ({
  nationalIdNumber,
  phone,
  excludeStudentId,
  excludeTeacherId,
}) => {
  const studentFilter = {};
  const teacherFilter = {};

  if (excludeStudentId) {
    studentFilter._id = { $ne: excludeStudentId };
  }

  if (excludeTeacherId) {
    teacherFilter._id = { $ne: excludeTeacherId };
  }

  const [studentByNationalId, teacherByNationalId] = await Promise.all([
    Student.findOne({ ...studentFilter, nationalIdNumber }).select('_id').lean(),
    Teacher.findOne({ ...teacherFilter, nationalIdNumber }).select('_id').lean(),
  ]);

  if (studentByNationalId || teacherByNationalId) {
    return 'CCCD đã tồn tại ở sinh viên hoặc giảng viên khác.';
  }

  const [studentByPhone, teacherByPhone] = await Promise.all([
    Student.findOne({ ...studentFilter, phone }).select('_id').lean(),
    Teacher.findOne({ ...teacherFilter, phone }).select('_id').lean(),
  ]);

  if (studentByPhone || teacherByPhone) {
    return 'Số điện thoại đã tồn tại ở sinh viên hoặc giảng viên khác.';
  }

  return '';
};

app.post('/api/students', async (req, res) => {
  const payload = normalizeStudentPayload(req.body);
  const validationMessage = validateStudentPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage,
    });
  }

  try {
    const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
    });

    if (duplicateIdentityMessage) {
      return res.status(409).json({
        success: false,
        message: duplicateIdentityMessage,
      });
    }

    const normalizedStudentCode = payload.studentCode;

    const existingStudent = await Student.findOne({ studentCode: normalizedStudentCode });
    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: 'Mã số sinh viên đã tồn tại.',
      });
    }

    const username = buildStudentUsername(normalizedStudentCode);
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Tài khoản sinh viên đã tồn tại.',
      });
    }

    const createdUser = await User.create({
      username,
      password: DEFAULT_ACCOUNT_PASSWORD,
      role: 'student',
      status: true,
    });

    try {
      const student = await Student.create({
        userId: createdUser._id,
        studentCode: normalizedStudentCode,
        fullName: payload.fullName,
        dob: payload.dob,
        gender: payload.gender,
        nationalIdNumber: payload.nationalIdNumber,
        phone: payload.phone,
        address: payload.address,
        major: payload.major,
        academicYear: payload.academicYear,
      });

      return res.status(201).json({
        success: true,
        student,
      });
    } catch (error) {
      await User.findByIdAndDelete(createdUser._id);
      throw error;
    }
  } catch (error) {
    const duplicateCode = error.code === 11000;

    return res.status(duplicateCode ? 409 : 500).json({
      success: false,
      message: duplicateCode ? 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' : 'Lỗi server khi thêm sinh viên.',
    });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const payload = normalizeStudentPayload(req.body);
  const validationMessage = validateStudentPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage,
    });
  }

  try {
    const existingStudent = await Student.findById(req.params.id).select('userId');

    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.',
      });
    }

    const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      excludeStudentId: req.params.id,
    });

    if (duplicateIdentityMessage) {
      return res.status(409).json({
        success: false,
        message: duplicateIdentityMessage,
      });
    }

    const expectedUsername = buildStudentUsername(payload.studentCode);
    const usernameExists = await User.findOne({
      username: expectedUsername,
      _id: { $ne: existingStudent.userId },
    }).select('_id').lean();

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Tên tài khoản sinh viên chuẩn đã tồn tại.',
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        studentCode: payload.studentCode,
        fullName: payload.fullName,
        dob: payload.dob,
        gender: payload.gender,
        nationalIdNumber: payload.nationalIdNumber,
        phone: payload.phone,
        address: payload.address,
        major: payload.major,
        academicYear: payload.academicYear,
      },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(existingStudent.userId, { username: expectedUsername }, { runValidators: true });

    return res.json({
      success: true,
      student,
    });
  } catch (error) {
    const duplicateCode = error.code === 11000;

    return res.status(duplicateCode ? 409 : 500).json({
      success: false,
      message: duplicateCode ? 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' : 'Lỗi server khi cập nhật sinh viên.',
    });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.',
      });
    }

    await User.findByIdAndDelete(student.userId);

    return res.json({
      success: true,
      message: 'Đã xóa sinh viên thành công.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa sinh viên.',
    });
  }
});

app.get('/api/teachers', async (req, res) => {
  try {
    const keyword = String(req.query.search || '').trim();
    const filter = keyword
      ? {
          $or: [
            { teacherCode: { $regex: keyword, $options: 'i' } },
            { fullName: { $regex: keyword, $options: 'i' } },
          ],
        }
      : {};

    const teachers = await Teacher.find(filter)
      .sort({ teacherCode: 1 })
      .select('teacherCode fullName dob gender phone address department nationalIdNumber userId');

    return res.json({
      success: true,
      teachers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải danh sách giảng viên.',
    });
  }
});

app.get('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id)
      .select('teacherCode fullName dob gender phone address department nationalIdNumber userId');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên.',
      });
    }

    return res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tải chi tiết giảng viên.',
    });
  }
});

const normalizeTeacherPayload = (body = {}) => ({
  teacherCode: String(body.teacherCode || '').trim(),
  fullName: String(body.fullName || '').trim(),
  dob: String(body.dob || '').trim(),
  gender: String(body.gender || '').trim(),
  nationalIdNumber: String(body.nationalIdNumber || '').trim(),
  phone: String(body.phone || '').trim(),
  address: String(body.address || '').trim(),
  department: String(body.department || '').trim(),
});

const validateTeacherPayload = (payload) => {
  if (!payload.teacherCode) {
    return 'Vui lòng nhập mã số giảng viên.';
  }

  if (!/^\d+$/.test(payload.teacherCode)) {
    return 'Mã số giảng viên chỉ được nhập số.';
  }

  if (!payload.fullName) {
    return 'Vui lòng nhập họ và tên.';
  }

  if (!/^[\p{L}\s]+$/u.test(payload.fullName)) {
    return 'Họ và tên chỉ được nhập chữ.';
  }

  if (!payload.dob) {
    return 'Vui lòng nhập ngày sinh.';
  }

  if (Number.isNaN(new Date(payload.dob).getTime())) {
    return 'Ngày sinh không hợp lệ.';
  }

  if (!payload.gender) {
    return 'Vui lòng chọn giới tính.';
  }

  if (!['Nam', 'Nữ'].includes(payload.gender)) {
    return 'Giới tính chỉ được chọn Nam hoặc Nữ.';
  }

  if (!payload.nationalIdNumber) {
    return 'Vui lòng nhập CCCD.';
  }

  if (!/^\d{12}$/.test(payload.nationalIdNumber)) {
    return 'CCCD phải gồm đúng 12 số.';
  }

  if (!payload.phone) {
    return 'Vui lòng nhập số điện thoại.';
  }

  if (!/^\d{10}$/.test(payload.phone)) {
    return 'Số điện thoại phải gồm đúng 10 số.';
  }

  if (!payload.address) {
    return 'Vui lòng nhập địa chỉ.';
  }

  if (!payload.department) {
    return 'Vui lòng nhập khoa/viện công tác.';
  }

  return '';
};

app.post('/api/teachers', async (req, res) => {
  const payload = normalizeTeacherPayload(req.body);
  const validationMessage = validateTeacherPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage,
    });
  }

  try {
    const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
    });

    if (duplicateIdentityMessage) {
      return res.status(409).json({
        success: false,
        message: duplicateIdentityMessage,
      });
    }

    const normalizedTeacherCode = payload.teacherCode;

    const existingTeacher = await Teacher.findOne({ teacherCode: normalizedTeacherCode });
    if (existingTeacher) {
      return res.status(409).json({
        success: false,
        message: 'Mã số giảng viên đã tồn tại.',
      });
    }

    const username = buildTeacherUsername(normalizedTeacherCode);
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Tài khoản giảng viên đã tồn tại.',
      });
    }

    const createdUser = await User.create({
      username,
      password: DEFAULT_ACCOUNT_PASSWORD,
      role: 'teacher',
      status: true,
    });

    try {
      const teacher = await Teacher.create({
        userId: createdUser._id,
        teacherCode: normalizedTeacherCode,
        fullName: payload.fullName,
        dob: payload.dob,
        gender: payload.gender,
        nationalIdNumber: payload.nationalIdNumber,
        phone: payload.phone,
        address: payload.address,
        department: payload.department,
      });

      return res.status(201).json({
        success: true,
        teacher,
      });
    } catch (error) {
      await User.findByIdAndDelete(createdUser._id);
      throw error;
    }
  } catch (error) {
    const duplicateCode = error.code === 11000;

    return res.status(duplicateCode ? 409 : 500).json({
      success: false,
      message: duplicateCode ? 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' : 'Lỗi server khi thêm giảng viên.',
    });
  }
});

app.put('/api/teachers/:id', async (req, res) => {
  const payload = normalizeTeacherPayload(req.body);
  const validationMessage = validateTeacherPayload(payload);

  if (validationMessage) {
    return res.status(400).json({
      success: false,
      message: validationMessage,
    });
  }

  try {
    const existingTeacher = await Teacher.findById(req.params.id).select('userId');

    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên.',
      });
    }

    const duplicateIdentityMessage = await checkDuplicateIdentityAcrossStudentsAndTeachers({
      nationalIdNumber: payload.nationalIdNumber,
      phone: payload.phone,
      excludeTeacherId: req.params.id,
    });

    if (duplicateIdentityMessage) {
      return res.status(409).json({
        success: false,
        message: duplicateIdentityMessage,
      });
    }

    const expectedUsername = buildTeacherUsername(payload.teacherCode);
    const usernameExists = await User.findOne({
      username: expectedUsername,
      _id: { $ne: existingTeacher.userId },
    }).select('_id').lean();

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: 'Tên tài khoản giảng viên chuẩn đã tồn tại.',
      });
    }

    const teacher = await Teacher.findByIdAndUpdate(
      req.params.id,
      {
        teacherCode: payload.teacherCode,
        fullName: payload.fullName,
        dob: payload.dob,
        gender: payload.gender,
        nationalIdNumber: payload.nationalIdNumber,
        phone: payload.phone,
        address: payload.address,
        department: payload.department,
      },
      { new: true, runValidators: true }
    );

    await User.findByIdAndUpdate(existingTeacher.userId, { username: expectedUsername }, { runValidators: true });

    return res.json({
      success: true,
      teacher,
    });
  } catch (error) {
    const duplicateCode = error.code === 11000;

    return res.status(duplicateCode ? 409 : 500).json({
      success: false,
      message: duplicateCode ? 'Dữ liệu bị trùng, vui lòng kiểm tra lại.' : 'Lỗi server khi cập nhật giảng viên.',
    });
  }
});

app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findByIdAndDelete(req.params.id);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên.',
      });
    }

    await User.findByIdAndDelete(teacher.userId);

    return res.json({
      success: true,
      message: 'Đã xóa giảng viên thành công.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa giảng viên.',
    });
  }
});

app.get('/api/students/:id/account', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('userId studentCode');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên.',
      });
    }

    const account = await ensureAccountUsername({
      userId: student.userId,
      expectedUsername: buildStudentUsername(student.studentCode),
    });

    return res.json({
      success: true,
      account: {
        userId: account._id,
        username: account.username,
        role: account.role,
        status: account.status,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Lỗi server khi tải thông tin tài khoản sinh viên.',
    });
  }
});

app.get('/api/teachers/:id/account', async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).select('userId teacherCode');

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy giảng viên.',
      });
    }

    const account = await ensureAccountUsername({
      userId: teacher.userId,
      expectedUsername: buildTeacherUsername(teacher.teacherCode),
    });

    return res.json({
      success: true,
      account: {
        userId: account._id,
        username: account.username,
        role: account.role,
        status: account.status,
      },
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      success: false,
      message: error.status ? error.message : 'Lỗi server khi tải thông tin tài khoản giảng viên.',
    });
  }
});

app.patch('/api/users/:id/account', async (req, res) => {
  try {
    const shouldResetPassword = req.body.resetPassword === true;
    const hasStatus = typeof req.body.status === 'boolean';

    if (!shouldResetPassword && !hasStatus) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu dữ liệu cập nhật tài khoản.',
      });
    }

    const updateData = {};
    if (hasStatus) {
      updateData.status = req.body.status;
    }
    if (shouldResetPassword) {
      updateData.password = DEFAULT_ACCOUNT_PASSWORD;
    }

    const account = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('username role status');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản.',
      });
    }

    return res.json({
      success: true,
      message: shouldResetPassword
        ? 'Đã đặt lại mật khẩu mặc định 123456.'
        : 'Đã cập nhật trạng thái tài khoản.',
      account: {
        userId: account._id,
        username: account.username,
        role: account.role,
        status: account.status,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tài khoản.',
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server đang chạy ở port: ${PORT}`);
});