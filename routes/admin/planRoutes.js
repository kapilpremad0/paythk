const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const planController = require('../../controllers/admin/planController.js');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, planController.getList);
router.post('/', adminAuth, upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), planController.storeData);
router.get('/create', adminAuth, planController.create);
router.get('/:id', adminAuth, planController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "images", maxCount: 10 },{ name: "profile", maxCount: 1 }]), planController.updateData);
router.get('/edit/:id', adminAuth, planController.edit);
router.post('/data', adminAuth, planController.getData);
router.delete("/:id", adminAuth, planController.deleteRecord);

module.exports = router;
