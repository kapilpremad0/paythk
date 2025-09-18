const express = require('express');
const router = express.Router();
const verifyToken = require('../../middlewares/auth.js'); // 👈 Import middleware


router.use('/auth', require('../api/auth'));
router.use('/', require('../api/home.js'));
router.use('/profile', verifyToken, require('../api/profile'));
router.use('/chat', require('../api/chat'));
router.use('/rental', require('../api/rental'));



module.exports = router;
