/**
 * Seed subjects extracted from HUST IT-VJ program curriculum (PDF).
 * Uses upsert so running multiple times is safe.
 */
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const Subject = require('../Models/Subject');

const subjects = [
  // Đồ án / Khóa luận tốt nghiệp
  { subjectCode: 'IT4125', name: 'Đồ án tốt nghiệp', department: 'Đào tạo', credits: 6, finalWeight: 0.6 },

  // Lý luận chính trị + Pháp luật đại cương
  { subjectCode: 'SSH1111', name: 'Triết học Mác - Lênin', department: 'Lý luận chính trị', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'SSH1121', name: 'Kinh tế chính trị Mác - Lênin', department: 'Lý luận chính trị', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'SSH1131', name: 'Chủ nghĩa xã hội khoa học', department: 'Lý luận chính trị', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'SSH1141', name: 'Lịch sử Đảng cộng sản Việt Nam', department: 'Lý luận chính trị', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'SSH1151', name: 'Tư tưởng Hồ Chí Minh', department: 'Lý luận chính trị', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'EM1170', name: 'Pháp luật đại cương', department: 'Lý luận chính trị', credits: 2, finalWeight: 0.6 },

  // Giáo dục thể chất
  { subjectCode: 'PE1014', name: 'Lý luận TDTT', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE1015', name: 'Thể dục tay không', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE1024', name: 'Bơi lội', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2101', name: 'Bóng chuyền 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2102', name: 'Bóng chuyền 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2103', name: 'Bóng chuyền 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2201', name: 'Bóng đá 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2202', name: 'Bóng đá 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2203', name: 'Bóng đá 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2301', name: 'Bóng rổ 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2302', name: 'Bóng rổ 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2303', name: 'Bóng rổ 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2401', name: 'Bóng bàn 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2402', name: 'Bóng bàn 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2403', name: 'Bóng bàn 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2501', name: 'Cầu lông 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2502', name: 'Cầu lông 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2503', name: 'Cầu lông 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2601', name: 'Chạy', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2701', name: 'Nhảy cao', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2801', name: 'Nhảy xa', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2901', name: 'Xà kép, xà lệch', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2151', name: 'Erobic', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2251', name: 'Taekwondo 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2252', name: 'Taekwondo 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2253', name: 'Taekwondo 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE2261', name: 'Karatedo', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3101', name: 'Chuyên sâu Bóng chuyền 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3102', name: 'Chuyên sâu Bóng chuyền 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3103', name: 'Chuyên sâu Bóng chuyền 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3104', name: 'Chuyên sâu Bóng chuyền 4', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3105', name: 'Chuyên sâu Bóng chuyền 5', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3201', name: 'Chuyên sâu Bóng đá 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3202', name: 'Chuyên sâu Bóng đá 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3203', name: 'Chuyên sâu Bóng đá 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3204', name: 'Chuyên sâu Bóng đá 4', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3205', name: 'Chuyên sâu Bóng đá 5', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3301', name: 'Chuyên sâu Bóng rổ 1', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3302', name: 'Chuyên sâu Bóng rổ 2', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3303', name: 'Chuyên sâu Bóng rổ 3', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3304', name: 'Chuyên sâu Bóng rổ 4', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'PE3305', name: 'Chuyên sâu Bóng rổ 5', department: 'Giáo dục thể chất', credits: 0, finalWeight: 0.6 },

  // Giáo dục Quốc phòng - An ninh
  { subjectCode: 'MIL1210', name: 'Đường lối quốc phòng và an ninh của Đảng Cộng sản Việt Nam', department: 'Giáo dục quốc phòng', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'MIL1220', name: 'Công tác quốc phòng và an ninh', department: 'Giáo dục quốc phòng', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'MIL1230', name: 'Quân sự chung', department: 'Giáo dục quốc phòng', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'MIL1240', name: 'Kỹ thuật chiến đấu bộ binh và chiến thuật', department: 'Giáo dục quốc phòng', credits: 0, finalWeight: 0.6 },

  // Tiếng Anh
  { subjectCode: 'FL1131', name: 'Tiếng Anh cơ sở 1', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'FL1132', name: 'Tiếng Anh cơ sở 2', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'FL1133', name: 'Tiếng Anh cơ sở 3', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'FL1134', name: 'Tiếng Anh cơ sở 4', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'FL1135', name: 'Tiếng Anh cơ sở 5', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },

  // Tiếng Nhật
  { subjectCode: 'JP1110', name: 'Tiếng Nhật 1', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'JP1120', name: 'Tiếng Nhật 2', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'JP1132', name: 'Tiếng Nhật 3', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'JP2111', name: 'Tiếng Nhật 4', department: 'Ngoại ngữ', credits: 0, finalWeight: 0.6 },
  { subjectCode: 'JP2126', name: 'Tiếng Nhật 5', department: 'Ngoại ngữ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'JP2132', name: 'Tiếng Nhật 6', department: 'Ngoại ngữ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'JP2210', name: 'Tiếng Nhật 7', department: 'Ngoại ngữ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'JP2220', name: 'Tiếng Nhật 8', department: 'Ngoại ngữ', credits: 1, finalWeight: 0.6 },
  { subjectCode: 'JP3110', name: 'Tiếng Nhật chuyên ngành 1', department: 'Ngoại ngữ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'JP3120', name: 'Tiếng Nhật chuyên ngành 2', department: 'Ngoại ngữ', credits: 2, finalWeight: 0.6 },

  // Toán và Khoa học cơ bản
  { subjectCode: 'MI1144', name: 'Đại số tuyến tính', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'MI1114', name: 'Giải tích I', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'MI1124', name: 'Giải tích II', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'MI1134', name: 'Phương trình vi phân và Chuỗi', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'MI2021', name: 'Xác suất thống kê', department: 'Toán - Khoa học cơ bản', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'PH1110', name: 'Vật lý đại cương I', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3420', name: 'Điện tử cho CNTT', department: 'Toán - Khoa học cơ bản', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT2140', name: 'Điện tử cho CNTT lab', department: 'Toán - Khoa học cơ bản', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT2000', name: 'Nhập môn CNTT và TT', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3020', name: 'Toán rời rạc', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4110', name: 'Tính toán khoa học', department: 'Toán - Khoa học cơ bản', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4172', name: 'Xử lý tín hiệu', department: 'Toán - Khoa học cơ bản', credits: 2, finalWeight: 0.6 },

  // Cơ sở và cốt lõi ngành
  { subjectCode: 'IT3362', name: 'Kỹ năng ITSS học bằng tiếng Nhật 1', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3382', name: 'Kỹ năng ITSS học bằng tiếng Nhật 2', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3210', name: 'C Programming Language', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3220', name: 'C Programming (Introduction)', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4593', name: 'Nhập môn kỹ thuật truyền thông', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3011', name: 'Cấu trúc dữ liệu và thuật toán', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3230', name: 'Lập trình C cơ bản', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3170', name: 'Thuật toán ứng dụng', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4082', name: 'Kỹ thuật phần mềm', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3070', name: 'Nguyên lý hệ điều hành', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3080', name: 'Mạng máy tính', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3292', name: 'Cơ sở dữ liệu', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3290', name: 'Thực hành cơ sở dữ liệu', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3160', name: 'Nhập môn Trí tuệ nhân tạo', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3103', name: 'Lập trình hướng đối tượng', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT3283', name: 'Kiến trúc máy tính', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3280', name: 'Thực hành kiến trúc máy tính', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4015', name: 'Nhập môn an toàn thông tin', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT5021', name: 'Nghiên cứu tốt nghiệp 1', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT5022', name: 'Nghiên cứu tốt nghiệp 2', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4549', name: 'Phát triển phần mềm theo chuẩn kỹ năng ITSS', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4062', name: 'Thực hành Lập trình mạng', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3323', name: 'Xây dựng chương trình dịch', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },

  // Kiến thức bổ trợ
  { subjectCode: 'IT2030', name: 'Technical Writing and Presentation', department: 'Kiến thức bổ trợ', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'CH2021', name: 'Đổi mới sáng tạo và khởi nghiệp', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ME3123', name: 'Thiết kế mỹ thuật công nghiệp', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ME3124', name: 'Thiết kế quảng bá sản phẩm', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'EM1010', name: 'Quản trị học đại cương', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'EM1180', name: 'Văn hóa kinh doanh và tinh thần khởi nghiệp', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ED3280', name: 'Tâm lý học ứng dụng', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ED3220', name: 'Kỹ năng mềm', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ED3220E', name: 'Kỹ năng mềm (tiếng Anh)', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'ET3262', name: 'Tư duy công nghệ và thiết kế kỹ thuật', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'TEX3123', name: 'Thiết kế mỹ thuật công nghiệp (TEX)', department: 'Kiến thức bổ trợ', credits: 2, finalWeight: 0.6 },

  // Thực tập
  { subjectCode: 'IT4948', name: 'Thực tập công nghiệp', department: 'Thực tập', credits: 2, finalWeight: 0.6 },

  // Tự chọn định hướng (Mô đun 1 & 2)
  { subjectCode: 'IT4409', name: 'Công nghệ Web và dịch vụ trực tuyến', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4785', name: 'Phát triển ứng dụng cho thiết bị di động', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4653', name: 'Học sâu và ứng dụng', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT4930', name: 'Nhập môn Khoa học dữ liệu', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
  { subjectCode: 'IT3190', name: 'Nhập môn Học máy và khai phá dữ liệu', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4441', name: 'Giao diện và trải nghiệm người dùng', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4210', name: 'Hệ nhúng', department: 'Công nghệ thông tin', credits: 3, finalWeight: 0.6 },
  { subjectCode: 'IT4735', name: 'IoT và ứng dụng', department: 'Công nghệ thông tin', credits: 2, finalWeight: 0.6 },
];

(async () => {
  await connectDB();
  let inserted = 0;
  let skipped = 0;

  for (const s of subjects) {
    const result = await Subject.findOneAndUpdate(
      { subjectCode: s.subjectCode },
      { $setOnInsert: s },
      { upsert: true, new: false }
    );
    if (result === null) {
      inserted++;
    } else {
      skipped++;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Already existed (skipped): ${skipped}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
