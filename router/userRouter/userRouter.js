const express = require('express');
const router = express.Router();
const { signUp, login, updatePassword } = require('../../controller/userController/userController');
const upload = require('../../middlewares/fiels');

// Sign-up route
router.post('/signup',upload.single('profile_image'), signUp);

// Login route
router.post('/login', login);

// Update password route
router.patch('/updatepassword', updatePassword);

module.exports = router;
