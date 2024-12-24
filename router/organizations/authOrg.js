const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/fiels');
const {
    signUp,
    signIn,
    changePassword,
    forgetPassword,
    getMyOrders,
    patchProfileImage
} = require('../../controller/organizationController');

router.post('/signup',upload.single('profile_image'), signUp);
router.post('/signin', signIn);
router.post('/change-password', changePassword);
router.post('/forget-password', forgetPassword); 
router.get('/get-my-orders', getMyOrders);
router.patch('/profile-image/:userId', upload.single('profile_image'), patchProfileImage);
module.exports = router;
