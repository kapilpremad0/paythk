const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const rentalController = require('../../controllers/admin/rentalController');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, rentalController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 }]), rentalController.storeData);
router.get('/create', adminAuth, rentalController.create);
router.get('/:id', adminAuth, rentalController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "licenseDocument", maxCount: 1 }]), rentalController.updateData);
router.get('/edit/:id', adminAuth, rentalController.edit);
router.post('/data', adminAuth, rentalController.getData);
router.delete("/:id", adminAuth, rentalController.deleteRecord);

module.exports = router;
