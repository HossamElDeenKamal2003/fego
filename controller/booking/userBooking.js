const mongoose = require('mongoose');
const bookModel = require('../../model/booking/userBooking');
const driverDestination = require('../../model/booking/driversDestination');
const detailTrip = require('../../model/regestration/driverModel.js');
const booking = require('../../model/booking/userBooking.js')
const io = require('socket.io');
//const { io } = require('../../server.js'); // Adjust this import according to your setup

// const findDriversInternal = async function(req,res, vehicleType, latitude, longitude){
//     try{

//     }
//     catch(error){
//         console.log(error);
//     }
// }
// Find nearby drivers
// const findDrivers = async (req, res) => {
//     const { vehicleType, latitude, longitude } = req.body;

//     // Validate input
//     if (!vehicleType || latitude === undefined || longitude === undefined) {
//         return res.status(400).json({ error: 'Vehicle type, latitude, and longitude are required' });
//     }

//     try {
//         // First, check for drivers with the matching vehicle type
//         const vehicles = await driverDestination.find({ vehicleType });
        
//         if (vehicles.length === 0) {
//             return res.status(404).json({ error: 'No vehicles match your choice' });
//         }

//         // Now, find nearby drivers based on location and vehicle type
//         const drivers = await driverDestination.find({
//             vehicleType,
//             location: {
//                 $near: {
//                     $geometry: {
//                         type: "Point",
//                         coordinates: [longitude, latitude]
//                     },
//                     $maxDistance: 5000 // Distance in meters, 5km = 5000m
//                 }
//             }
//         });

//         if (drivers.length === 0) {
//             return res.status(404).json({ error: 'No drivers available in your area' });
//         }

//         // Find detailed information for each nearby driver
//         const driverDetails = await Promise.all(
//             drivers.map(async (driver) => {
//                 const detail = await detailTrip.findOne({ _id: driver.driverId });
//                 return {
//                     ...driver.toObject(),
//                     ...detail?.toObject() // Use optional chaining to avoid errors if detail is not found
//                 };
//             })
//         );

//         // Emit driver details to all connected clients via WebSocket
//         global.io.emit('driversFound', driverDetails);
//         return res.status(200).json(driverDetails);
//     } catch (error) {
//         console.error('Error finding drivers:', error);
//         return res.status(500).json({ error: 'INTERNAL SERVER ERROR' });
//     }
// }
const findDrivers = async (req, res, vehicleType, latitude, longitude) => {
    // Validate input
    if (!vehicleType || latitude === undefined || longitude === undefined) {
        throw new Error('Vehicle type, latitude, and longitude are required');
    }

    try {
        // First, check for drivers with the matching vehicle type
        const vehicles = await driverDestination.find({ vehicleType });
        
        if (vehicles.length === 0) {
            throw new Error('No vehicles match your choice');
        }

        // Now, find nearby drivers based on location and vehicle type
        const drivers = await driverDestination.find({
            vehicleType,
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
            throw new Error('No drivers available in your area');
        }

        // Find detailed information for each nearby driver
        const driverDetails = await Promise.all(
            drivers.map(async (driver) => {
                const detail = await detailTrip.findOne({ _id: driver.driverId });
                return {
                    ...driver.toObject(),
                    ...detail?.toObject() // Use optional chaining to avoid errors if detail is not found
                };
            })
        );

        return res.status(200).json(driverDetails);
    } catch (error) {
        console.error('Error finding drivers:', error);
        throw error;
    }
}
// Book a trip
const bookTrip = async (req, res) => {
    const { id, distance, username, destination, latitude, longitude, destlatitude, destlongtitude, cost } = req.body;
    try {
        // Validate input
        if (!id || !distance || !username || !destination || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new booking with status 'pending'
        const newBooking = new bookModel({
            userId: id,
            distance: distance,
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
            cost: cost,
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

const calculateCost = async function(req, res) {
    const { tripId, cost } = req.body;
    try {
        const trip = await bookModel.findOne({ _id: tripId });
        if (!trip) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const newCost = await bookModel.findByIdAndUpdate(
            tripId,
            { cost },
            { new: true } // Optionally, return the updated document
        );

        return res.status(200).json({ message: 'Cost updated successfully', newCost });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
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

const cancelledTripbeforestart = async function(req,res){
    const {tripId} = req.body;
    try{
        if(!tripId){
            res.status(400).json({message: 'trip id is required'})
        }
        const booking = await bookModel.findOne({ _id: tripId});
        booking.status = 'cancelled';
        const updatedBooking = await booking.save();
        res.status(200).json({updatedBooking});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

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

const allTrips = async function(req, res){
    try{
        const trips = await bookModel.find();
        res.status(200).json(trips);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
    }
}

module.exports = {
    findDrivers,
    bookTrip,
    acceptTrip,
    updateStatus,
    cost,
    startTrip,
    canceledTrip,
    endTrip,
    calculateCost,
    cancelledTripbeforestart,
    allTrips
};
