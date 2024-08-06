const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    destination: {
        type: String,
        required: true,
    },
    
    pickupLocation: {
        type: { type: String, enum: ['Point'], required: true },
        coordinates: { type: [Number], required: true },
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'destDriver',
        required: true,
    },
    status: {
        type: String,
        //enum: ['pending', 'accepted', 'completed', 'cancelled'],
        //default: 'pending',
    },
    cost:{
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

bookSchema.index({ pickupLocation: '2dsphere' });

const bookModel = mongoose.model('bookModel', bookSchema);

module.exports = bookModel;
