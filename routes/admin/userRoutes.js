const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const userController = require('../../controllers/admin/userController');
const router = express.Router();

router.get('/', adminAuth, userController.getUserList);
router.post('/data', adminAuth, userController.getuserData);


router.delete("/:id", adminAuth, userController.deleteRecord);

module.exports = router;
