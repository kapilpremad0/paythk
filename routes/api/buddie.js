const express = require('express');
const router = express.Router();
const buddieController = require('../../controllers/api/buddieController.js');


router.get('/',buddieController.getData);
router.post('/like-dislike',buddieController.likeDislike);
router.post('/send-request',buddieController.sendRequest);
router.get('/send-request',buddieController.getRequests);

module.exports = router;
