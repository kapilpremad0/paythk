const express = require('express');
const router = express.Router();

// Panel subroutes
router.use('/', require('../panel/homeRoutes'));

module.exports = router;
