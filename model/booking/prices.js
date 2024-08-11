const mongoose = require('mongoose');

const pricesSchema = new mongoose.Schema({
    // tripId:{
    //     type:  mongoose.Schema.Types.ObjectId,
    //     require: true
    // },
    country:{
        type: String,
        require: true,
        default: 'egypt'
    },
    priceCar:{
        type: Number,
        require: true
    },
    motorocycle: {
        type: Number,
        require: true
    },
    priceVan: {
        type: Number,
        require: true
    }
})

const prices = new mongoose.model('prices', pricesSchema);
module.exports = prices