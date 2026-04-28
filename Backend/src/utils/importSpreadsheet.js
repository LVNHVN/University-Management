const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

const isCsvFile = ({ fileName = '', mimeType = '' } = {}) => {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  return ext === '.csv' || mime.includes('csv') || mime.includes('excel') || mime === 'text/plain';
};

const isExcelFile = ({ fileName = '', mimeType = '' } = {}) => {
  const ext = path.extname(String(fileName || '')).toLowerCase();
  const mime = String(mimeType || '').toLowerCase();

  return (
    ext === '.xlsx' ||
    ext === '.xls' ||
    mime.includes('spreadsheetml') ||
    mime.includes('excel')
  );
};

const isSupportedImportFile = (fileMeta = {}) => isCsvFile(fileMeta) || isExcelFile(fileMeta);

const normalizeRowKeys = (row) => {
  const entries = Object.entries(row || {}).map(([key, value]) => [String(key || '').trim(), value]);
  return Object.fromEntries(entries);
};

const isMeaningfulCell = (value) => String(value ?? '').trim() !== '';

const parseImportRecords = (fileBuffer, fileMeta = {}) => {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    const error = new Error('File import rỗng hoặc không hợp lệ.');
    error.status = 400;
    throw error;
  }

  const parsedAsExcel = isExcelFile(fileMeta);

  if (!parsedAsExcel && !isCsvFile(fileMeta)) {
    const error = new Error('Chỉ hỗ trợ định dạng .csv, .xlsx hoặc .xls.');
    error.status = 400;
    throw error;
  }

  try {
    if (parsedAsExcel) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: false });
      const firstSheetName = workbook.SheetNames?.[0];

      if (!firstSheetName) {
        return [];
      }

      const sheet = workbook.Sheets[firstSheetName];
      const records = XLSX.utils.sheet_to_json(sheet, {
        raw: false,
        defval: '',
        blankrows: false,
      });

      return records
        .map(normalizeRowKeys)
        .filter((row) => Object.values(row).some(isMeaningfulCell));
    }

    return parse(fileBuffer, {
      columns: (headers) => headers.map((header) => String(header || '').trim()),
      skip_empty_lines: true,
      trim: true,
      bom: true,
    });
  } catch (_error) {
    const error = new Error('Không đọc được file import. Vui lòng kiểm tra định dạng file.');
    error.status = 400;
    throw error;
  }
};

module.exports = {
  isSupportedImportFile,
  parseImportRecords,
};
