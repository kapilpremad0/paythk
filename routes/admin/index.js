const express = require('express');
const router = express.Router();

// Admin subroutes
router.use('/', require('../admin/homeRoutes'));

router.use('/users', require('../admin/userRoutes'));
router.use('/hostels', require('../admin/hostelRoutes'));
router.use('/rentals', require('../admin/rentalRoutes'));
router.use('/guides', require('../admin/guideRoutes'));
router.use('/cafes', require('./cafeRoutes.js'));
router.use('/settings', require('./settingRoutes.js'));
router.use('/transactions', require('./transactionRoutes.js'));

module.exports = router;
