const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const settingController = require('../../controllers/admin/settingController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, settingController.getList);
router.post('/', adminAuth, upload.fields([{ name: "profile", maxCount: 1 }]), settingController.storeData);


module.exports = router;
