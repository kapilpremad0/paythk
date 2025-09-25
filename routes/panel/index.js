const express = require('express');
const router = express.Router();

// Panel subroutes
router.use('/', require('./homeRoutes.js'));

module.exports = router;
