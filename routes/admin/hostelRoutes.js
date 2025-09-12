const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const hostelController = require('../../controllers/admin/hostelController');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, hostelController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 }]), hostelController.storeData);
router.get('/create', adminAuth, hostelController.create);
router.get('/:id', adminAuth, hostelController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "licenseDocument", maxCount: 1 }]), hostelController.updateData);
router.get('/edit/:id', adminAuth, hostelController.edit);
router.post('/data', adminAuth, hostelController.getData);
router.delete("/:id", adminAuth, hostelController.deleteRecord);

module.exports = router;
