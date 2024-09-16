const express = require('express');
const {
    findDrivers,
    bookTrip,
    updateStatus,
    acceptTrip,
    startTrip,
    canceledTrip,
    endTrip,
    calculateCost,
    cancelledTripbeforestart,
    allTrips,
    arriving,
    history,
    driverRate,
    updateCost,
    driverHistory,
    addPrice,
    updatePrice,
    getPrice,
    deletePrice,
    updateDistance,
    getDistance,
    retrieveTrip,
    userWallet,
    getUserWallet,
    newApi,
    getAcceptModel,
    seeTrip
} = require('../../controller/booking/userBooking');
const {
    addOffer,
    getOffer
} = require('../../controller/booking/offers');
//const { updateLocation } = require('../../controller/booking/driverDest');
const router = express.Router();

router.post('/findDrivers', findDrivers);
router.post('/bookTrip', bookTrip);
router.patch('/cost', calculateCost);
router.get('/history/:id', history);
router.patch('/update-rate', driverRate);
router.patch('/update-cost', updateCost);
//router.patch('/updatelocation', updateLocation);
router.patch('/updatestatus', updateStatus);
router.patch('/accept-trip', acceptTrip);
router.patch('/start-trip', startTrip);
router.patch('/arriving', arriving);
router.patch('/end-trip', endTrip);
router.patch('/cancelled-trip', canceledTrip); 
router.patch('/cancelled_before_start', cancelledTripbeforestart);
router.put('/add-offer', addOffer);
router.put('/get-offer', getOffer);
router.get('/get-trips', allTrips);
router.get('/driver-history/:id', driverHistory);
router.post('/add-price', addPrice)
router.patch('/updatePrice', updatePrice);
router.get('/get-prices', getPrice);
router.post('/delete-price', deletePrice);
router.patch('/max-distance', updateDistance);
router.get('/get-distance-find-drivers', getDistance);
router.post('/retreive-data', retrieveTrip);
router.patch('/update-wallet/:id', userWallet);
router.get('/get-user-wallet/:id', getUserWallet);
router.get('/new-api/:id', newApi);
router.post('/get-accepted', getAcceptModel);
router.post('/see-trip', seeTrip);
module.exports = router;
