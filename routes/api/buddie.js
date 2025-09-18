const express = require('express');
const router = express.Router();
const buddieController = require('../../controllers/api/buddieController.js');


router.get('/',buddieController.getData);
router.post('/like-dislike',buddieController.likeDislike);

module.exports = router;
