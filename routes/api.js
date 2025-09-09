const express = require('express');
const router = express.Router();
const playController = require('../controllers/homeController.js');
const homeController = require('../controllers/homeController.js');
const verifyToken = require('../middlewares/auth'); // 👈 Import middleware




router.get('/general-settings',verifyToken,playController.generalSettings);
router.get('/terms', homeController.termsPage);

module.exports = router;
