const express = require('express');
const adminAuth = require('../../middlewares/adminAuth.js');
const couponController = require('../../controllers/admin/couponController.js');
const upload = require('../../middlewares/upload.js');


const router = express.Router();

router.get('/', adminAuth, couponController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), couponController.storeData);
router.get('/create', adminAuth, couponController.create);
router.get('/:id', adminAuth, couponController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), couponController.updateData);
router.get('/edit/:id', adminAuth, couponController.edit);
router.post('/data', adminAuth, couponController.getData);
router.delete("/:id", adminAuth, couponController.deleteRecord);

module.exports = router;
