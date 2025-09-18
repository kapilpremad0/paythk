const express = require('express');
const router = express.Router();
const cafeController = require('../../controllers/api/cafeController.js');


router.get('/',cafeController.getData);
router.get('/:id',cafeController.getDetailData);




module.exports = router;
