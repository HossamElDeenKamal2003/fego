const express = require('express');
const upload = require('../../middlewares/fiels');
const router = express.Router();
// const upload = require('../../middlewares/fiels');

const {
    signUp,
    signIn,
    changePassword,
    forgetPassword,
    patchProfileImage
} = require('../../controller/usersController')

router.post('/signup',upload.single('profile_image'), signUp);
router.post('/signin', signIn);
router.post('/change-password', changePassword);
router.post('/forget-password', forgetPassword);
router.patch('/profile-image/:userId', upload.single('profile_image'), patchProfileImage);

module.exports = router;
