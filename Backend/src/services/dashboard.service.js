const ClassModel = require('../../Models/Class');
const Tuition = require('../../Models/Tuition');
const Student = require('../../Models/Student');
const Teacher = require('../../Models/Teacher');
const { getLatestSemester } = require('../utils/semester');

const getOverview = async (requestedSemester) => {
  const [classSemesters, tuitionSemesters] = await Promise.all([
    ClassModel.distinct('semester'),
    Tuition.distinct('semester'),
  ]);

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
      { $match: { semester: targetSemester, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$totalAmount' } } } },
    ]),
    Student.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $trim: { input: { $ifNull: ['$major', ''] } } }, ''] },
              'Chưa xác định',
              { $trim: { input: { $ifNull: ['$major', ''] } } },
            ],
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1, _id: 1 } },
    ]),
    Tuition.aggregate([
      { $match: { semester: targetSemester } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const statusCountMap = { Paid: 0, Unpaid: 0 };
  tuitionStatusResult.forEach((item) => {
    if (Object.hasOwn(statusCountMap, item._id)) {
      statusCountMap[item._id] = item.count;
    }
  });

  return {
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
  };
};

module.exports = { getOverview };
