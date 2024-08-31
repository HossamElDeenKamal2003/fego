const mongoose = require('mongoose');

function dateHandle(){
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const finalDate = `${day}-${month}-${year}`;
    return finalDate;
}

const bookingSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
    },
    distance:{
        type: String,
        //required: true
    },
    username: {
        type: String,
        required: true
    },
    destination: {
        type: String,
        required: true
    },
    pickupLocationName:{
        type: String,
        require: true
    },
    time: {
        type: String,
        require: true,
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    destinationLocation:{
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver',
        //required: true
    },
    carModel: { 
        type: String 
    },
    vehicleType: {
        type: String 
    },
    status: {
        type: String, default: 'Pending' 
    },
    phoneNumber: {
        type: String
    },

    cost:{
        type: Number,
    },
    date:{
        type: String,
        default: dateHandle()
    }
});

// Create a 2dsphere index on the pickupLocation field
bookingSchema.index({ pickupLocation: '2dsphere' });
bookingSchema.index({ destinationLocation: '2dsphere' });

const bookModel = mongoose.model('Booking', bookingSchema);

module.exports = bookModel;
