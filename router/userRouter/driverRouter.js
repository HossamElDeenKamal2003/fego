const express = require('express');
const router = express.Router();
const { signup, login, updatePassword } = require('../../controller/userController/driverController');
const upload = require('../../middlewares/fiels'); // Ensure path and filename are correct

router.post('/driversignup', upload.fields([{ name: 'licenseImage', maxCount: 1 }, { name: 'driver_licence_image', maxCount: 1 }]), signup);
router.post('/driverlogin', login);
router.patch('/updatedriverpass', updatePassword);

module.exports = router;
