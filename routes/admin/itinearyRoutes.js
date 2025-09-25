const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const itinearyController = require('../../controllers/admin/itinearyController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, itinearyController.getList);
router.post('/data', adminAuth, itinearyController.getData);
router.get('/:id', adminAuth, itinearyController.getDetail);


module.exports = router;
