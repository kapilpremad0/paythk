const express = require('express');
const adminAuth = require('../../middlewares/adminAuth');
const userController = require('../../controllers/admin/userController');
const upload = require('../../middlewares/upload');


const router = express.Router();

router.get('/', adminAuth, userController.getList);
router.post('/', adminAuth, upload.fields([{ name: "profile", maxCount: 1 }]), userController.storeData);
router.get('/create', adminAuth, userController.create);
router.get('/:id', adminAuth, userController.getDetail);
router.put('/:id', adminAuth,upload.fields([{ name: "profile", maxCount: 1 }]), userController.updateData);
router.get('/edit/:id', adminAuth, userController.edit);
router.post('/data', adminAuth, userController.getData);
router.delete("/:id", adminAuth, userController.deleteRecord);

module.exports = router;
