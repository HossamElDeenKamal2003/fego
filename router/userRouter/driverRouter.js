const express = require('express');
const router = express.Router();
const { signup, login, updatePassword, patchBlock, DeleteUser, patchAlerts } = require('../../controller/userController/driverController');
const upload = require('../../middlewares/fiels'); 

router.post('/driversignup', upload.fields([{ name: 'licenseImage', maxCount: 1 }, { name: 'driver_licence_image', maxCount: 1 },{ name: 'profile_image', maxCount: 1 }]), signup);
router.post('/driverlogin', login);
router.patch('/updatedriverpass', updatePassword);
router.patch('/patch-block/:id', patchBlock);
router.delete('/delete-user/:id', DeleteUser);
router.patch('/patch-alerts:/id', patchAlerts);
module.exports = router;
