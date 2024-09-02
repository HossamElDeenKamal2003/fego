const express = require('express');
const router = express.Router();
const { getAllUsers, getAllDrivers, deleteUser, deleteDriver, getDriverlocation, trips, distacne, alert, updateProperity, getProperity, addProperites} = require('../../controller/aminPanel/adminPanel');
const { signup, signin } = require('../../controller/aminPanel/authAdmin');
router.post('/update-distance', distacne);
router.patch('/increase/:id', alert)
router.get('/get-users', getAllUsers);
router.get('/get-drivers', getAllDrivers);
router.get('/location/:id', getDriverlocation)
router.get('/trips', trips);
router.delete('/delete-user/:id', deleteUser);
router.delete('/delete-driver/:id', deleteDriver);
router.post('/signup', signup);
router.post('/signin', signin);
router.patch('/patch-time-distance', updateProperity);
router.get('/get-properties', getProperity);
router.post('/add-prop', addProperites);
module.exports = router;
