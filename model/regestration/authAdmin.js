const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    username: {
        type: String,
        require: true
    },
    password: {
        type: String,
        require: true
    },
    role: {
        type: String,
        default: "admin"
    }
})

const AuthAdmin = new mongoose.model('AuthAdmin', adminSchema);
module.exports = AuthAdmin;