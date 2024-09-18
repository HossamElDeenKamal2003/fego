const mongoose = require('mongoose');

const pricesSchema = new mongoose.Schema({
    country: {
        type: String,
        required: true,
        default: 'egypt'
    },
    priceCar: {
        type: Number,
        required: true
    },
    motorocycle: {
        type: Number,
        required: true
    },
    priceVan: {
        type: Number,
        required: true
    }
});

const PricesModel = mongoose.model('Prices', pricesSchema);
module.exports = PricesModel;
