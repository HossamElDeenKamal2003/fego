// models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    profile_image:{
        type: String,
        required: true
    },
    userFCMToken:{
        type: String,
        default: null,
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    block:{
        type: Boolean,
        default: true
    },
    alerts: {
        type: Number,
        default: 0
    },
    otp: {
        type: String,
        default: null
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    wallet: {
        type: Number,
    }
});

// Hash password before saving
// userSchema.pre('save', async function (next) {
// if (!this.isModified('password')) {
//     return next();
// }
// try {
//     const salt = await bcrypt.genSalt(10);
//     this.password = await bcrypt.hash(this.password, salt);
//     next();
// } catch (error) {
//     next(error);
// }
// });

// // Compare passwords
// userSchema.methods.comparePassword = async function (candidatePassword) {
// return await bcrypt.compare(candidatePassword, this.password);
// };

const User = mongoose.model('User', userSchema);

module.exports = User;
