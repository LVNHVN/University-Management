const { Router } = require('express');
const { handleUpdateAccount } = require('../controllers/accounts.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.patch('/:id/account', handleUpdateAccount);

module.exports = router;
