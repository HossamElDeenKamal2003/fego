const express = require('express'); 
const router = express.Router();
const {
    updateEmail,
    updateUsername,
    updatePhoneNumber
} = require('../../controller/userprofile/patchUserdata');

// Define the routes
router.patch('/updateusername/:id', updateUsername);
router.patch('/update-email/:id', updateEmail);
router.patch('/update-phone-number/:id', updatePhoneNumber);

module.exports = router; 
