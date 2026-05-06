const multer = require('multer');

const errorHandler = (err, req, res, _next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Kích thước file vượt quá giới hạn 10MB.'
      : 'File tải lên không hợp lệ.';

    return res.status(400).json({
      success: false,
      message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Lỗi server.',
  });
};

module.exports = errorHandler;
