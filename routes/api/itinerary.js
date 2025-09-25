const express = require('express');
const router = express.Router();
const itineraryController = require('../../controllers/api/itineraryController.js');


router.get('/',itineraryController.getData);
router.post('/',itineraryController.storeData);
router.get('/:id',itineraryController.getDetailData);


module.exports = router;
