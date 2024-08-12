const bookModel = require('../../model/booking/userBooking');
const driverDestination = require('../../model/regestration/driverModel');

const findDrivers = async (req, res) => {
    const { destination, latitude, longitude } = req.body;
    try {
        const drivers = await driverDestination.find({
            destination: destination,
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 5000 // Distance in meters, 1km = 1000m
                }
            }
        });

        if (drivers.length === 0) {
            return res.status(404).json({ message: 'No drivers available here' });
        }

        res.status(200).json(drivers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

const bookTrip = async (req, res) => {
    const { username, destination, latitude, longitude, driverId } = req.body;
    try {
        const newBooking = new bookModel({
            username: username,
            destination: destination,
            pickupLocation: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            driver: driverId,
        });

        // Save the new booking
        await newBooking.save();

        // Populate the driver details if driverId is provided
        const populatedBooking = await bookModel.findById(newBooking._id).populate('driver');
        res.status(200).json(populatedBooking);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

module.exports = {
    findDrivers,
    bookTrip,
};
