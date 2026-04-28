const { Router } = require('express');
const { handleVerifyRecaptcha, handleLogin } = require('../controllers/auth.controller');

const router = Router();

router.post('/verify-recaptcha', handleVerifyRecaptcha);
router.post('/login', handleLogin);

module.exports = router;
