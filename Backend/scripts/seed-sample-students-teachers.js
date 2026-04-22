const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../Models/User');
const Student = require('../Models/Student');
const Teacher = require('../Models/Teacher');

const DEFAULT_PASSWORD = '123456';

const STUDENT_SAMPLES = [
  {
    studentCode: '1001',
    fullName: 'Nguyen Minh Anh',
    dob: '2004-01-12',
    gender: 'Nam',
    nationalIdNumber: '880100000001',
    phone: '0987001001',
    address: 'Hai Ba Trung, Ha Noi',
    major: 'Cong nghe thong tin',
    academicYear: '66',
  },
  {
    studentCode: '1002',
    fullName: 'Tran Thu Ha',
    dob: '2004-03-22',
    gender: 'Nu',
    nationalIdNumber: '880100000002',
    phone: '0987001002',
    address: 'Cau Giay, Ha Noi',
    major: 'Khoa hoc may tinh',
    academicYear: '66',
  },
  {
    studentCode: '1003',
    fullName: 'Le Quang Huy',
    dob: '2003-11-08',
    gender: 'Nam',
    nationalIdNumber: '880100000003',
    phone: '0987001003',
    address: 'Nam Tu Liem, Ha Noi',
    major: 'Ky thuat may tinh',
    academicYear: '65',
  },
  {
    studentCode: '1004',
    fullName: 'Pham Thanh Mai',
    dob: '2004-07-19',
    gender: 'Nu',
    nationalIdNumber: '880100000004',
    phone: '0987001004',
    address: 'Thanh Xuan, Ha Noi',
    major: 'He thong thong tin',
    academicYear: '66',
  },
  {
    studentCode: '1005',
    fullName: 'Do Duc Long',
    dob: '2002-09-25',
    gender: 'Nam',
    nationalIdNumber: '880100000005',
    phone: '0987001005',
    address: 'Dong Da, Ha Noi',
    major: 'An toan thong tin',
    academicYear: '64',
  },
  {
    studentCode: '1006',
    fullName: 'Bui Lan Huong',
    dob: '2003-05-15',
    gender: 'Nu',
    nationalIdNumber: '880100000006',
    phone: '0987001006',
    address: 'Bac Tu Liem, Ha Noi',
    major: 'Ky thuat phan mem',
    academicYear: '65',
  },
  {
    studentCode: '1007',
    fullName: 'Vu Tien Dat',
    dob: '2004-10-02',
    gender: 'Nam',
    nationalIdNumber: '880100000007',
    phone: '0987001007',
    address: 'Ha Dong, Ha Noi',
    major: 'Tri tue nhan tao',
    academicYear: '66',
  },
];

const TEACHER_SAMPLES = [
  {
    teacherCode: '2001',
    fullName: 'Nguyen Hoang Son',
    dob: '1984-02-10',
    gender: 'Nam',
    nationalIdNumber: '990200000001',
    phone: '0978002001',
    address: 'Tay Ho, Ha Noi',
    department: 'Cong nghe phan mem',
  },
  {
    teacherCode: '2002',
    fullName: 'Tran Thu Trang',
    dob: '1987-06-18',
    gender: 'Nu',
    nationalIdNumber: '990200000002',
    phone: '0978002002',
    address: 'Ba Dinh, Ha Noi',
    department: 'Khoa hoc may tinh',
  },
  {
    teacherCode: '2003',
    fullName: 'Le Van Quan',
    dob: '1981-12-01',
    gender: 'Nam',
    nationalIdNumber: '990200000003',
    phone: '0978002003',
    address: 'Long Bien, Ha Noi',
    department: 'He thong thong tin',
  },
  {
    teacherCode: '2004',
    fullName: 'Pham Hai Yen',
    dob: '1989-04-09',
    gender: 'Nu',
    nationalIdNumber: '990200000004',
    phone: '0978002004',
    address: 'Hoang Mai, Ha Noi',
    department: 'An toan thong tin',
  },
  {
    teacherCode: '2005',
    fullName: 'Do Tuan Kiet',
    dob: '1979-08-14',
    gender: 'Nam',
    nationalIdNumber: '990200000005',
    phone: '0978002005',
    address: 'Dong Anh, Ha Noi',
    department: 'Ky thuat may tinh',
  },
  {
    teacherCode: '2006',
    fullName: 'Bui Minh Chau',
    dob: '1986-03-27',
    gender: 'Nu',
    nationalIdNumber: '990200000006',
    phone: '0978002006',
    address: 'Gia Lam, Ha Noi',
    department: 'Khoa hoc du lieu',
  },
  {
    teacherCode: '2007',
    fullName: 'Vu Thanh Nam',
    dob: '1983-11-30',
    gender: 'Nam',
    nationalIdNumber: '990200000007',
    phone: '0978002007',
    address: 'Me Linh, Ha Noi',
    department: 'Tri tue nhan tao',
  },
];

async function ensureUserAccount({ existingUserId, expectedUsername, role }) {
  if (existingUserId) {
    const existingUser = await User.findById(existingUserId);

    if (existingUser) {
      const duplicateUsername = await User.findOne({
        username: expectedUsername,
        _id: { $ne: existingUserId },
      }).select('_id');

      if (duplicateUsername) {
        throw new Error(`Username ${expectedUsername} da ton tai o tai khoan khac.`);
      }

      existingUser.username = expectedUsername;
      existingUser.password = DEFAULT_PASSWORD;
      existingUser.role = role;
      existingUser.status = true;
      await existingUser.save();
      return existingUser;
    }
  }

  return User.findOneAndUpdate(
    { username: expectedUsername },
    {
      $set: {
        username: expectedUsername,
        password: DEFAULT_PASSWORD,
        role,
        status: true,
      },
    },
    { returnDocument: 'after', upsert: true, setDefaultsOnInsert: true }
  );
}

async function seedStudents() {
  for (const item of STUDENT_SAMPLES) {
    const expectedUsername = `SV_${item.studentCode}`;
    const existingStudent = await Student.findOne({ studentCode: item.studentCode }).select('userId');

    const user = await ensureUserAccount({
      existingUserId: existingStudent?.userId,
      expectedUsername,
      role: 'student',
    });

    await Student.findOneAndUpdate(
      { studentCode: item.studentCode },
      {
        $set: {
          userId: user._id,
          studentCode: item.studentCode,
          fullName: item.fullName,
          dob: item.dob,
          gender: item.gender,
          nationalIdNumber: item.nationalIdNumber,
          phone: item.phone,
          address: item.address,
          major: item.major,
          academicYear: item.academicYear,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Upserted student: ${item.studentCode} (${expectedUsername})`);
  }
}

async function seedTeachers() {
  for (const item of TEACHER_SAMPLES) {
    const expectedUsername = `GV_${item.teacherCode}`;
    const existingTeacher = await Teacher.findOne({ teacherCode: item.teacherCode }).select('userId');

    const user = await ensureUserAccount({
      existingUserId: existingTeacher?.userId,
      expectedUsername,
      role: 'teacher',
    });

    await Teacher.findOneAndUpdate(
      { teacherCode: item.teacherCode },
      {
        $set: {
          userId: user._id,
          teacherCode: item.teacherCode,
          fullName: item.fullName,
          dob: item.dob,
          gender: item.gender,
          nationalIdNumber: item.nationalIdNumber,
          phone: item.phone,
          address: item.address,
          department: item.department,
        },
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`Upserted teacher: ${item.teacherCode} (${expectedUsername})`);
  }
}

async function seedSampleStudentsTeachers() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('Missing MONGO_URI in .env');
  }

  await mongoose.connect(uri);
  await seedStudents();
  await seedTeachers();
  console.log('Seed sample students/teachers completed.');
}

seedSampleStudentsTeachers()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Seed failed:', error.message);
    try {
      await mongoose.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors in failure path.
    }
    process.exit(1);
  });
