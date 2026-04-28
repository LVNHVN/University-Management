const { Router } = require('express');
const { handleGetOverview } = require('../controllers/dashboard.controller');

const router = Router();

router.get('/overview', handleGetOverview);

module.exports = router;
