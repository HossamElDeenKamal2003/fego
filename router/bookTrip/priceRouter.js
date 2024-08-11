const express = require('express');
const router = express.Router();
const {
    putPrices,
    patchPrices
} = require('../../controller/booking/prices');
router.post('/putprices', putPrices);
router.patch('/updateprices', patchPrices);

module.exports = router;