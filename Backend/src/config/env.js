require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const PORT = process.env.PORT || 5000;
const DEFAULT_ACCOUNT_PASSWORD = '123456';

module.exports = { MONGO_URI, RECAPTCHA_SECRET_KEY, PORT, DEFAULT_ACCOUNT_PASSWORD };
