/**
 * Seed 10 sample classes using existing subjects and teachers.
 */
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Class = require('../Models/Class');
const Subject = require('../Models/Subject');
const Teacher = require('../Models/Teacher');

const classData = [
  { classCode: 'IT3292-01', subjectCode: 'IT3292', teacherCode: '100201', semester: '20241', studentCount: 45, dayOfWeek: 2, startTime: '07:00', endTime: '09:50', room: 'B1-101' },
  { classCode: 'IT3292-02', subjectCode: 'IT3292', teacherCode: '100202', semester: '20241', studentCount: 42, dayOfWeek: 4, startTime: '07:00', endTime: '09:50', room: 'B1-102' },
  { classCode: 'IT3103-01', subjectCode: 'IT3103', teacherCode: '100201', semester: '20241', studentCount: 50, dayOfWeek: 3, startTime: '09:00', endTime: '11:50', room: 'B1-201' },
  { classCode: 'IT3011-01', subjectCode: 'IT3011', teacherCode: '100202', semester: '20241', studentCount: 48, dayOfWeek: 5, startTime: '07:00', endTime: '09:50', room: 'B1-301' },
  { classCode: 'IT3080-01', subjectCode: 'IT3080', teacherCode: '2001',   semester: '20241', studentCount: 40, dayOfWeek: 2, startTime: '13:00', endTime: '15:50', room: 'B4-101' },
  { classCode: 'IT3070-01', subjectCode: 'IT3070', teacherCode: '2002',   semester: '20241', studentCount: 43, dayOfWeek: 6, startTime: '07:00', endTime: '09:50', room: 'B4-201' },
  { classCode: 'MI1114-01', subjectCode: 'MI1114', teacherCode: '2003',   semester: '20241', studentCount: 55, dayOfWeek: 3, startTime: '07:00', endTime: '09:50', room: 'D3-101' },
  { classCode: 'MI1144-01', subjectCode: 'MI1144', teacherCode: '2004',   semester: '20241', studentCount: 52, dayOfWeek: 4, startTime: '13:00', endTime: '15:50', room: 'D3-201' },
  { classCode: 'IT4015-01', subjectCode: 'IT4015', teacherCode: '2005',   semester: '20241', studentCount: 38, dayOfWeek: 5, startTime: '13:00', endTime: '15:50', room: 'B1-401' },
  { classCode: 'IT3020-01', subjectCode: 'IT3020', teacherCode: '2006',   semester: '20241', studentCount: 46, dayOfWeek: 7, startTime: '07:00', endTime: '09:50', room: 'D3-301' },
];

(async () => {
  await connectDB();

  const subjectCodes = [...new Set(classData.map((c) => c.subjectCode))];
  const teacherCodes = [...new Set(classData.map((c) => c.teacherCode))];

  const subjects = await Subject.find({ subjectCode: { $in: subjectCodes } }).select('_id subjectCode').lean();
  const teachers = await Teacher.find({ teacherCode: { $in: teacherCodes } }).select('_id teacherCode').lean();

  const subjectMap = Object.fromEntries(subjects.map((s) => [s.subjectCode, s._id]));
  const teacherMap = Object.fromEntries(teachers.map((t) => [t.teacherCode, t._id]));

  let inserted = 0;
  let skipped = 0;

  for (const c of classData) {
    const subjectId = subjectMap[c.subjectCode];
    const teacherId = teacherMap[c.teacherCode];

    if (!subjectId) { console.warn(`Subject not found: ${c.subjectCode}`); skipped++; continue; }
    if (!teacherId) { console.warn(`Teacher not found: ${c.teacherCode}`); skipped++; continue; }

    const existing = await Class.findOne({ classCode: c.classCode }).select('_id').lean();
    if (existing) { console.log(`Skipped (exists): ${c.classCode}`); skipped++; continue; }

    await Class.create({
      classCode: c.classCode,
      subjectId,
      teacherId,
      semester: c.semester,
      studentCount: c.studentCount,
      dayOfWeek: c.dayOfWeek,
      startTime: c.startTime,
      endTime: c.endTime,
      room: c.room,
    });

    console.log(`Inserted: ${c.classCode}`);
    inserted++;
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
