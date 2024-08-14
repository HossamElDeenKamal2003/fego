const mongoose = require('mongoose');

const offersSchema = new mongoose.Schema({
    tripId: {
        type: String,
        required: true,
    },
    driverId: {
        type: String,
        required: true
    },
    offer:{
        type: Number,
        required: true
    }
})

const offerModel = new mongoose.model('offer', offersSchema);
module.exports = offerModel;