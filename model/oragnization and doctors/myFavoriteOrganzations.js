const mongoose = require('mongoose');

const favSchema = new mongoose.Schema({
    userId: {
        type: String
    },
    oragnizationId: {
        type: String
    }
});

const favModel = new mongoose.model('favModel', favSchema);
module.exports = favModel;