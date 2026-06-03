require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';
const PORT = process.env.PORT || 5000;
const CORS_ORIGINS = process.env.CORS_ORIGINS || '';
const DEFAULT_ACCOUNT_PASSWORD = '123456';

module.exports = { MONGO_URI, RECAPTCHA_SECRET_KEY, JWT_SECRET, PORT, CORS_ORIGINS, DEFAULT_ACCOUNT_PASSWORD };
