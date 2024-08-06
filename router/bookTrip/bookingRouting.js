const express = require('express');
const { findDrivers, bookTrip } = require('../../controller/booking/userBooking');
const { updateLocation } = require('../../controller/booking/driverDest');

const router = express.Router();

router.post('/findDrivers', findDrivers);
router.post('/bookTrip', bookTrip);
router.patch('/updateLocation', updateLocation);

module.exports = router;
