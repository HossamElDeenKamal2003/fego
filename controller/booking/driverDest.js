const mongoose = require('mongoose');
const DestDriver = require('../../model/booking/driversDestination');

const updateLocation = async (req, res) => {
    const { driverId, longitude, latitude } = req.body;

    if (!driverId || longitude === undefined || latitude === undefined) {
        return res.status(400).send('Driver ID, longitude, and latitude are required');
    }

    if (!mongoose.isValidObjectId(driverId)) {
        return res.status(400).send('Invalid Driver ID');
    }

    try {
        const result = await DestDriver.findOneAndUpdate(
            { driverId: new mongoose.Types.ObjectId(driverId) },
            { location: { type: "Point", coordinates: [longitude, latitude] } },
            { new: true }
        );

        if (!result) {
            return res.status(404).send('Driver not found');
        }

        res.status(200).send(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    updateLocation,
};
