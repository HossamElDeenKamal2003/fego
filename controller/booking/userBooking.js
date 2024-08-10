const mongoose = require('mongoose');
const bookModel = require('../../model/booking/userBooking');
const driverDestination = require('../../model/booking/driversDestination');
const detailTrip = require('../../model/regestration/driverModel.js');

// Find nearby drivers
const findDrivers = async (req, res) => {
    const { latitude, longitude } = req.body;
    try {
        // Validate input
        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Latitude and longitude are required' });
        }

        // Find nearby drivers based on location
        const drivers = await driverDestination.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 5000 // Distance in meters, 5km = 5000m
                }
            }
        });

        if (drivers.length === 0) {
            return res.status(404).json({ message: 'No drivers available here' });
        }

        // Find detailed information for each nearby driver
        const driverDetails = await Promise.all(
            drivers.map(async (driver) => {
                const detail = await detailTrip.findOne({ _id: driver.driverId });
                return {
                    ...driver.toObject(),
                    ...detail.toObject()
                };
            })
        );

        // Return the combined driver location and details
        res.status(200).json(driverDetails);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

// Book a trip
const bookTrip = async (req, res) => {
    const { username, destination, latitude, longitude, destlatitude, destlongtitude } = req.body;
    try {
        // Validate input
        if (!username || !destination || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new booking with status 'pending'
        const newBooking = new bookModel({
            username: username,
            destination: destination,
            pickupLocation: {
                type: "Point",
                coordinates: [longitude, latitude]
            },
            destinationLocation:{
                type: "Point",
                coordinates: [destlongtitude, destlatitude]
            },

            status: 'pending' // Initial status
        });

        // Save the new booking
        const savedBooking = await newBooking.save();

        // Find available drivers
        const availableDrivers = await driverDestination.find({
            location: {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    $maxDistance: 5000 // Distance in meters, 5km = 5000m
                }
            }
        });

        // Debugging: Log available drivers
        console.log('Available Drivers:', availableDrivers);

        // if (availableDrivers.length === 0) {
        //     // If no drivers available, update booking status to 'no drivers available'
        //     savedBooking.status = 'no drivers available';
        //     await savedBooking.save();
        //     return res.status(404).json({ message: 'No drivers available here' });
        // }

        // // Assign the first available driver to the booking
        // const selectedDriver = availableDrivers[0];
        // savedBooking.driver = selectedDriver._id;
        // savedBooking.username = selectorFriver.username;
        // savedBooking.carModel = selectedDriver.carModel; // Uncomment if these fields exist
        // savedBooking.vehicleType = selectedDriver.vehicleType;
        // savedBooking.phoneNumber = selectedDriver.phoneNumber;

        // Update booking status to 'pending'
        savedBooking.status = 'pending';
        const updatedBooking = await savedBooking.save();

        // Return the updated booking
        return res.status(200).json(updatedBooking);
    } catch (error) {
        console.log(error); // Log the full error
        return res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

// Accept a trip
const acceptTrip = async (req, res) => {
    const { tripId, driverId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId) {
            console.log(tripId, driverId)
            return res.status(400).json({ message: 'Trip ID and Driver ID are required' });
        }

        // Fetch the booking by tripId and driverId
        const driverBook = await detailTrip.findOne({_id: driverId})
        const booking = await bookModel.findOne({ _id: tripId});

        if (!booking) {
            return res.status(404).json({ message: 'trip not found' });
        }
        if(!driverBook){
            return res.status(404).json({ message: 'driver not found' });
        }
        // Update the status to 'accepted'
        booking.status = 'accepted';
        const updatedBooking = await booking.save();

        res.status(200).json({updatedBooking, driverBook});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

// Start a trip
const startTrip = async (req, res) => {
    const { tripId, driverId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId) {
            return res.status(400).json({ message: 'Trip ID and Driver ID are required' });
        }

        const driverBook = await detailTrip.findOne({_id: driverId})
        const booking = await bookModel.findOne({ _id: tripId});

        if (!booking) {
            return res.status(404).json({ message: 'trip not found' });
        }
        if(!driverBook){
            return res.status(404).json({ message: 'driver not found' });
        }
        // Update the status to 'accepted'
        booking.status = 'start';
        const updatedBooking = await booking.save();

        res.status(200).json({updatedBooking, driverBook});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

// Cancel a trip
const canceledTrip = async (req, res) => {
    const { tripId, driverId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId) {
            return res.status(400).json({ message: 'Trip ID and Driver ID are required' });
        }

        const driverBook = await detailTrip.findOne({_id: driverId})
        const booking = await bookModel.findOne({ _id: tripId});

        if (!booking) {
            return res.status(404).json({ message: 'trip not found' });
        }
        if(!driverBook){
            return res.status(404).json({ message: 'driver not found' });
        }
        // Update the status to 'accepted'
        booking.status = 'cancelled';
        const updatedBooking = await booking.save();

        res.status(200).json({updatedBooking, driverBook});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

// End a trip
const endTrip = async (req, res) => {
    const { tripId, driverId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId) {
            return res.status(400).json({ message: 'Trip ID and Driver ID are required' });
        }

        const driverBook = await detailTrip.findOne({_id: driverId})
        const booking = await bookModel.findOne({ _id: tripId});

        if (!booking) {
            return res.status(404).json({ message: 'trip not found' });
        }
        if(!driverBook){
            return res.status(404).json({ message: 'driver not found' });
        }
        // Update the status to 'accepted'
        booking.status = 'end';
        const updatedBooking = await booking.save();

        res.status(200).json({updatedBooking, driverBook});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

// Update booking status
const updateStatus = async (req, res) => {
    const { tripId, status } = req.body;
    try {
        // Validate input
        if (!tripId || !status) {
            return res.status(400).json({ message: 'Trip ID and status are required' });
        }

        // Update booking status
        const updatedBooking = await bookModel.findByIdAndUpdate(
            tripId,
            { status: status }, // Assuming there's a status field in your schema
            { new: true } // Return the updated document
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.status(200).json(updatedBooking);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Calculate trip cost
const cost = async (req, res) => {
    const { km, country } = req.body;
    try {
        // Define cost rates per kilometer for each country
        const rates = {
            egypt: 15,     
            american: 2.0, 
            russian: 1.2,   
            italia: 2.5     
        };

        // Get the rate for the specified country
        const rate = rates[country.toLowerCase()];
        if (!rate) {
            return res.status(400).json({ message: 'Invalid country' });
        }

        // Calculate the cost
        const cost = km * rate;

        // Return the cost
        res.status(200).json({ cost: cost.toFixed(2) }); // Return cost rounded to 2 decimal places
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    findDrivers,
    bookTrip,
    acceptTrip,
    updateStatus,
    cost,
    startTrip,
    canceledTrip,
    endTrip,
};
