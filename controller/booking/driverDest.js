const Driver = require('../../model/regestration/driverModel'); // Adjust the path as necessary

// Controller function to update driver's location
const updateDriverLocation = async (req, res) => {
    const { driverId, type, coordinates } = req.body;

    if (!driverId || !type || !coordinates) {
        return res.status(400).json({ message: 'Driver ID, location type, and coordinates are required' });
    }

    // Ensure coordinates are an array of numbers
    const parsedCoordinates = coordinates.split(',').map(Number);
    
    if (parsedCoordinates.length !== 2) {
        return res.status(400).json({ message: 'Coordinates must be an array of two numbers [longitude, latitude]' });
    }

    try {
        const updatedDriver = await Driver.findByIdAndUpdate(
            driverId,
            { currentLocation: { type, coordinates: parsedCoordinates } },
            { new: true, runValidators: true }
        );

        if (!updatedDriver) {
            return res.status(404).json({ message: 'Driver not found' });
        }

        res.status(200).json(updatedDriver);
    } catch (error) {
        res.status(500).json({ message: 'Error updating location', error: error.message });
    }
};

module.exports = {
    updateDriverLocation,
};
