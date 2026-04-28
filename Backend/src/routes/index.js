const { Router } = require('express');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const studentsRoutes = require('./students.routes');
const teachersRoutes = require('./teachers.routes');
const accountsRoutes = require('./accounts.routes');

const router = Router();

router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/users', accountsRoutes);

module.exports = router;
