const express = require('express');
const router = express.Router();
const rentalController = require('../../controllers/api/rentalController');


router.get('/',rentalController.getData);
router.get('/:id',rentalController.getDetailData);




module.exports = router;
