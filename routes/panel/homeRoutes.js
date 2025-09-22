const express = require('express');
const panelAuth = require('../../middlewares/panelAuth.js');
const homeController = require('../../controllers/panel/homeController');
const loginController = require('../../controllers/panel/loginController');
const router = express.Router();

router.get('/', panelAuth, homeController.dashboard);

router.get('/login',loginController.showLoginPage)
router.post('/login',loginController.login)
router.get('/logout',loginController.logout)
router.get('/stats', homeController.getDashboardStats)
router.get('/locations',homeController.getLocations);

module.exports = router;
