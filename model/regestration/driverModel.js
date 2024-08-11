const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Use bcryptjs for consistency

const driverSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    vehicleType: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    id: {
        type: String,
        required: true,
        unique: true,
    },
    carModel: {
        type: String,
        required: true,
    },
    licenseImage: {
        type: String,
        required: true,
    },
    licence_expire_date: {
        type: String,
        required: true,
    },
    driver_licence_image: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    }
});


const Driver = mongoose.model('Driver', driverSchema);

module.exports = Driver;
