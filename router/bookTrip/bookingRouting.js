const express = require('express');
const {
    findDrivers,
    bookTrip,
    updateStatus,
    acceptTrip,
    startTrip,
    canceledTrip, // Correct function name
    endTrip,
    calculateCost,
    cancelledTripbeforestart
} = require('../../controller/booking/userBooking');
const { updateLocation } = require('../../controller/booking/driverDest');
const router = express.Router();

router.post('/findDrivers', findDrivers);
router.post('/bookTrip', bookTrip);
router.patch('/cost', calculateCost);
router.patch('/updatelocation', updateLocation);
router.patch('/updatestatus', updateStatus);
router.patch('/accept-trip', acceptTrip);
router.patch('/start-trip', startTrip);
router.patch('/end-trip', endTrip);
router.patch('/cancelled-trip', canceledTrip); // Correct function name
router.patch('/cancelled_before_start', cancelledTripbeforestart);

module.exports = router;
