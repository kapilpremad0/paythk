const express = require('express');
const router = express.Router();
const playController = require('../controllers/authController');


router.post('/register',playController.register);
router.post('/login',playController.login);
router.post('/forgot-password',playController.forgotPassword);
router.post('/verify-otp',playController.verifyOtp);
router.post('/reset-password',playController.resetPassword);



module.exports = router;
