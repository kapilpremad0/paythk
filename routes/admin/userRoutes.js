const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const userController = require('../../controllers/admin/userController');
const router = express.Router();

router.get('/', adminAuth, userController.getList);
router.get('/:id', adminAuth, userController.getDetail);
router.post('/data', adminAuth, userController.getData);
router.delete("/:id", adminAuth, userController.deleteRecord);

module.exports = router;
