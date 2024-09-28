const mongoose = require('mongoose');

const supportSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    role: {
        type: String,
        default: ""
    },
    email: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    password: {
        type: String
    }
});
const supportModel = new mongoose.model('support', supportSchema);
module.exports = supportModel;