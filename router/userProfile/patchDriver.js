const express = require('express');
const router = express.Router();
const upload = require('../../middlewares/fiels');
const {
    updateUsername,
    updatePhoneNumber,
    updateEmail,
    updateLicenseImage,
    updateDriverLicenseImage
} = require('../../controller/userprofile/patchDriverdata');

// Use the upload middleware for file upload routes
router.patch('/update-username/:id', updateUsername);
router.patch('/update-phone-number/:id', updatePhoneNumber);
router.patch('/update-email/:id', updateEmail);
router.patch('/update-license-image/:id', upload.fields([{ name: 'licenseImage', maxCount: 1 }]), updateLicenseImage);
router.patch('/update-driver-license-image/:id', upload.fields([{ name: 'driver_licence_image', maxCount: 1 }]), updateDriverLicenseImage);

module.exports = router;
