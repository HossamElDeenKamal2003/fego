const mongoose = require('mongoose');
const destDriver = require('../../model/booking/driversDestination');
//const io = require('../../server'); 

const { ObjectId } = mongoose.Types;

const updateLocation = async (driverId, longitude, latitude) => {
    if (!driverId || longitude === undefined || latitude === undefined) {
        throw new Error('Driver ID, longitude, and latitude are required');
    }

    if (!ObjectId.isValid(driverId)) {
        throw new Error('Invalid Driver ID');
    }

    try {
        const result = await destDriver.findOneAndUpdate(
            { _id: new ObjectId(driverId) },
            { location: { type: "Point", coordinates: [longitude, latitude] } },
            { new: true }
        );

        if (!result) {
            throw new Error('Driver not found');
        }

        return result;
    } catch (error) {
        throw error;
    }
};
module.exports = { updateLocation };
