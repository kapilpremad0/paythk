const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const transactionController = require('../../controllers/admin/transactionController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, transactionController.getList);
router.post('/data', adminAuth, transactionController.getData);


module.exports = router;
