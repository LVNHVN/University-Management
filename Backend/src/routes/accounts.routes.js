const { Router } = require('express');
const { handleUpdateAccount } = require('../controllers/accounts.controller');

const router = Router();

router.patch('/:id/account', handleUpdateAccount);

module.exports = router;
