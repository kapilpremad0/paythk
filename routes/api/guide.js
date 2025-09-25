const express = require('express');
const router = express.Router();
const guideController = require('../../controllers/api/guideController.js');


router.get('/',guideController.getData);
router.get('/:id',guideController.getDetailData);


module.exports = router;
