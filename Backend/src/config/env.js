require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = process.env.CORS_ORIGINS || '';
const DEFAULT_ACCOUNT_PASSWORD = '123456';
const VIETQR_BANK_ID = process.env.VIETQR_BANK_ID || '';
const SCHOOL_BANK_ACCOUNT_NO = process.env.SCHOOL_BANK_ACCOUNT_NO || '';
const SCHOOL_BANK_ACCOUNT_NAME = process.env.SCHOOL_BANK_ACCOUNT_NAME || '';

module.exports = {
	MONGO_URI,
	RECAPTCHA_SECRET_KEY,
	JWT_SECRET,
	PORT,
	CORS_ORIGINS,
	DEFAULT_ACCOUNT_PASSWORD,
	VIETQR_BANK_ID,
	SCHOOL_BANK_ACCOUNT_NO,
	SCHOOL_BANK_ACCOUNT_NAME,
};
