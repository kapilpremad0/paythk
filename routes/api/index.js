const express = require('express');
const router = express.Router();
const verifyToken = require('../../middlewares/auth.js'); // 👈 Import middleware


router.use('/auth', require('../api/auth'));
router.use('/', require('../api/home.js'));
router.use('/profile', verifyToken, require('../api/profile'));
router.use('/chat', require('../api/chat'));
router.use('/rentals', require('../api/rental'));
router.use('/cafes', require('../api/cafe'));
router.use('/guides', require('../api/guide'));



module.exports = router;
