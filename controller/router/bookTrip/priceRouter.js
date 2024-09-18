const express = require('express');
const router = express.Router();
const {
    putPrices,
    patchPrices,
    getPrices
} = require('../../controller/booking/prices');
router.post('/putprices', putPrices);
router.patch('/updateprices', patchPrices);
router.get('/getprices/:country', getPrices);
module.exports = router;