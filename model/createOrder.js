const mongoose = require('mongoose');

const orderScema = new mongoose.Schema({
    userId: {
        type: String
    },
    organizationId: {
        type: String
    },
    day: {
        type: String
    }
});

const orderModel = new mongoose.model('orders', orderScema);
module.exports = orderModel;