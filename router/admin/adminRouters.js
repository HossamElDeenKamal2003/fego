const express = require('express');
const router = express.Router();
const { getAllUsers, getAllDrivers } = require('../../controller/aminPanel/adminPanel');

router.get('/get-users', getAllUsers);
router.get('/get-drivers', getAllDrivers);

module.exports = router;
