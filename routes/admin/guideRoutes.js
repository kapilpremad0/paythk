const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const guideController = require('../../controllers/admin/guideController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, guideController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), guideController.storeData);
router.get('/create', adminAuth, guideController.create);
router.get('/:id', adminAuth, guideController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), guideController.updateData);
router.get('/edit/:id', adminAuth, guideController.edit);
router.post('/data', adminAuth, guideController.getData);
router.delete("/:id", adminAuth, guideController.deleteRecord);

module.exports = router;
