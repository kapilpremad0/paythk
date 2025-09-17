const express = require('express');
const router = express.Router();

// Admin subroutes
router.use('/', require('../admin/homeRoutes'));

router.use('/users', require('../admin/userRoutes'));
router.use('/hostels', require('../admin/hostelRoutes'));
router.use('/rentals', require('../admin/rentalRoutes'));

module.exports = router;
