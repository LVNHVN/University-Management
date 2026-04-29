const { Router } = require('express');
const { handleGetOverview } = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middleware/authenticate');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/overview', handleGetOverview);

module.exports = router;
