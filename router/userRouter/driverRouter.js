const express = require('express');
const router = express.Router();
const {signup, login,updatePassword} = require('../../controller/userController/driverController');
const { uploadImages } = require('../../middlewares/fiels');
router.post('/driversignup', uploadImages, signup);
router.post('/driverlogin', login);
router.patch('/updatedriverpass', updatePassword);
module.exports = router;