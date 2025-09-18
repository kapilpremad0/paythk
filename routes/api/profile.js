const express = require('express');
const router = express.Router();
const playController = require('../../controllers/api/profileController');
const upload = require('../../middlewares/upload');


router.post('/update-address', playController.updateAddress);

router.put('/', upload.fields([
    { name: 'profile', maxCount: 1 },    
]), playController.updateProfile);

router.get('/', playController.getProfile);
router.get('/delete-profile-image', playController.deleteProfile);

router.get('/optlize_routes', playController.optimizeBusRoute);
router.delete('/', playController.deleteAccount);

module.exports = router;
