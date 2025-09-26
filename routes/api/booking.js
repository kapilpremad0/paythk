const express = require('express');
const router = express.Router();
const bookingController = require('../../controllers/api/bookingController.js');


router.post('/rental',bookingController.bookRental);


module.exports = router;
