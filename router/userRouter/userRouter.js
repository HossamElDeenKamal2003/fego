const express = require('express');
const router = express.Router();
const { signUp, login, updatePassword } = require('../../controller/userController/userController');

// Sign-up route
router.post('/signup', signUp);

// Login route
router.post('/login', login);

// Update password route
router.patch('/updatepassword', updatePassword);

module.exports = router;
