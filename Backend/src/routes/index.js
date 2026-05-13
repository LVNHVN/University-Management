const { Router } = require('express');
const authRoutes = require('./auth.routes');
const dashboardRoutes = require('./dashboard.routes');
const studentsRoutes = require('./students.routes');
const teachersRoutes = require('./teachers.routes');
const subjectsRoutes = require('./subjects.routes');
const curriculumRoutes = require('./curriculum.routes');
const classRoutes = require('./class.routes');
const accountsRoutes = require('./accounts.routes');
const notificationsRoutes = require('./notifications.routes');

const router = Router();

router.use('/', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/subjects', subjectsRoutes);
router.use('/curriculum', curriculumRoutes);
router.use('/classes', classRoutes);
router.use('/users', accountsRoutes);
router.use('/notifications', notificationsRoutes);

module.exports = router;
