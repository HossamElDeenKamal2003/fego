const mongoose = require('mongoose');

const organizatioScehma = new mongoose.Schema({
    profile_image: {
        type: String
    },
    username: {
        type: String
    },
    role: {
        type: String
    },
    metaRole: {
        type: String
    },
    password: {
        type: String
    },
    address: {
        type: String
    },
    workDays: [
        {
            day: {
                type: String,
                enum: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                required: true
            },
            from: {
                type: String,
                required: true
            },
            to: {
                type: String,
                required: true
            }
        }
    ]
});

const organizationModel = mongoose.model("organizations", organizatioScehma);
module.exports = organizationModel;
