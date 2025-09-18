const express = require('express');
const router = express.Router();
const playController = require('../../controllers/api/homeController.js');
const homeController = require('../../controllers/api/homeController.js');
const verifyToken = require('../../middlewares/auth.js'); // 👈 Import middleware


router.get('/general-settings',playController.generalSettings);
router.get('/terms', homeController.termsPage);
router.get('/locations',homeController.getLocations);

module.exports = router;
