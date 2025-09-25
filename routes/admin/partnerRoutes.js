const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const partnerController = require('../../controllers/admin/partnerController');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, partnerController.getList);
router.post('/', adminAuth, upload.fields([{ name: "profile", maxCount: 1 }]), partnerController.storeData);
router.get('/create', adminAuth, partnerController.create);
router.get('/:id', adminAuth, partnerController.getDetail);
router.put('/:id', adminAuth, upload.fields([{ name: "profile", maxCount: 1 }]), partnerController.updateData);
router.get('/edit/:id', adminAuth, partnerController.edit);
router.post('/data', adminAuth, partnerController.getData);
router.delete("/:id", adminAuth, partnerController.deleteRecord);

module.exports = router;
