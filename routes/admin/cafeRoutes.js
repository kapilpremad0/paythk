const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const cafeController = require('../../controllers/admin/cafeController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, cafeController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), cafeController.storeData);
router.get('/create', adminAuth, cafeController.create);
router.get('/:id', adminAuth, cafeController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), cafeController.updateData);
router.get('/edit/:id', adminAuth, cafeController.edit);
router.post('/data', adminAuth, cafeController.getData);
router.delete("/:id", adminAuth, cafeController.deleteRecord);

module.exports = router;
