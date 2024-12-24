const express = require('express');
const router = express.Router();
const { signup, login, updatePassword, forgetPassword, checkEmail,sendVerification, verifyCode, sendVerificationForgetPass , patchBlock, handleToken, DeleteUser, patchAlerts, driverLocation } = require('../../controller/userController/driverController');
const upload = require('../../middlewares/fiels'); 
router.post('/driversignup', upload.fields([{ name: 'licenseImage', maxCount: 1 }, { name: 'driver_licence_image', maxCount: 1 },{ name: 'profile_image', maxCount: 1 }, {name: 'national_front', maxCount: 1}, {name: 'national_back', maxCount: 1}, {name: 'national_selfie', maxCount: 1}]), signup);
router.post('/driverlogin', login);
router.patch('/updatedriverpass', updatePassword);
router.patch('/patch-block/:id', patchBlock);
router.delete('/delete-user/:id', DeleteUser);
router.patch('/patch-alerts:/id', patchAlerts);
router.get('/location', driverLocation);
router.patch('/handle-token/:id', handleToken);
router.post('/send-verification', sendVerification);
router.post('/verify-code', verifyCode);
router.post('/sendVerificationForgetPass', sendVerificationForgetPass );
router.patch('/forgetPassword', forgetPassword);
router.post('/check-email', checkEmail);

module.exports = router;