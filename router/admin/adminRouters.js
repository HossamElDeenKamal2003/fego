const express = require('express');
const router = express.Router();
const { getAllUsers, getAllDrivers, deleteUser, deleteDriver, getDriverlocation, trips } = require('../../controller/aminPanel/adminPanel');

router.get('/get-users', getAllUsers);
router.get('/get-drivers', getAllDrivers);
router.get('/location/:id', getDriverlocation)
router.get('/trips', trips);
router.delete('/delete-user/:id', deleteUser);
router.delete('/delete-driver/:id', deleteDriver);
module.exports = router;
