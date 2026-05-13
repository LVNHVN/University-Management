const { Router } = require('express');
const {
	handleVerifyRecaptcha,
	handleLogin,
	handleMe,
	handleProfile,
	handleLogout,
	handleChangePassword,
} = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/authenticate');

const router = Router();

router.post('/verify-recaptcha', handleVerifyRecaptcha);
router.post('/login', handleLogin);
router.post('/logout', authenticate, handleLogout);
router.post('/change-password', authenticate, handleChangePassword);
router.get('/me', authenticate, handleMe);
router.get('/profile', authenticate, handleProfile);

module.exports = router;
