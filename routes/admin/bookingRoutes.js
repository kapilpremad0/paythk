const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const bookingController = require('../../controllers/admin/bookingController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, bookingController.getList);
router.post('/data', adminAuth, bookingController.getData);
router.get('/:id', adminAuth, bookingController.getDetail);


module.exports = router;
