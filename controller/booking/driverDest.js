const mongoose = require('mongoose');
const destDriver = require('../../model/booking/driversDestination');
//const io = require('../../server'); 

const updateLocation = async (req, res) => {
    const { driverId, longitude, latitude } = req.body;

    if (!driverId || longitude === undefined || latitude === undefined) {
        return res.status(400).json({ message: 'Driver ID, longitude, and latitude are required' });
    }

    if (!mongoose.isValidObjectId(driverId)) {
        return res.status(400).json({ message: 'Invalid Driver ID' });
    }

    try {
        const result = await destDriver.findOneAndUpdate(
            { _id: driverId },
            { location: { type: "Point", coordinates: [longitude, latitude] } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        // Emit the updated location to all connected clients
        io.emit('driverLocationUpdated', result);

        // Respond to the API call
        res.status(200).json(result);
    } catch (error) {
        console.error('Error updating location:', error);
        res.status(500).json({ message: error.message });
    }
};




module.exports = {
    updateLocation,
};
