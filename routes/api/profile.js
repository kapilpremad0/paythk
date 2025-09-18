const express = require('express');
const router = express.Router();
const playController = require('../../controllers/api/profileController');
const upload = require('../../middlewares/upload');


router.put('/', upload.fields([
    { name: 'profile', maxCount: 1 },{ name: "images", maxCount: 10 }    
]), playController.updateProfile);

router.get('/', playController.getProfile);
router.get('/delete-profile-image', playController.deleteProfile);
router.delete('/', playController.deleteAccount);

module.exports = router;
