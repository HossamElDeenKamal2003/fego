const mongoose = require('mongoose');

const destDriverSchema = new mongoose.Schema({
    driverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Driver', // Assuming there's a Driver model to reference
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    location: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    }
});

// Create a 2dsphere index on the location field
destDriverSchema.index({ location: '2dsphere' });

const DestDriver = mongoose.model('DestDriver', destDriverSchema);

module.exports = DestDriver;
