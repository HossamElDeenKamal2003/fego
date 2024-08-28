const mongoose = require('mongoose');
const bookModel = require('../../model/booking/userBooking');
const driverDestination = require('../../model/booking/driversDestination');
const detailTrip = require('../../model/regestration/driverModel.js');
const pendingModel = require('../../model/booking/pendingTrips.js')
const booking = require('../../model/booking/userBooking.js');
const DestDriver = require('../../model/booking/driversDestination.js');
const user = require('../../model/regestration/userModel.js');
const http = require('http');
const server = http.createServer();
const { Server } = require("socket.io");
const io = new Server(server);
const Distance = require('../../model/booking/maxDistance.js');
let connectedClients = {};
const findDrivers = async (vehicleType, latitude, longitude) => {
    // Validate input
    if (!vehicleType || latitude === undefined || longitude === undefined) {
        throw new Error('Vehicle type, latitude, and longitude are required');
    }

    try {
        const settings = await Distance.findOne({});
        const maxDistance = settings ? settings.maxDistance : 5000; 
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
                    $maxDistance: maxDistance // Use the dynamic maxDistance from settings
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

        // Send the response directly from the findDrivers function
        return driverDetails;
    } catch (error) {
        console.error('Error finding drivers:', error);
        throw error;
    }
}
// Book a trip
const bookTrip = async (req, res) => {
    const { id, distance, username, destination, latitude, longitude, destlatitude, destlongtitude, cost,pickupLocationName,time, vehicleType } = req.body;
    try {
        // Validate input
        if (!id || !distance || !username || !destination || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new booking with status 'pending'
        const newBooking = new bookModel({
            userId: id,
            distance: distance,
            pickupLocationName: pickupLocationName,
            time: time,
            username: username,
            destination: destination,
            vehicleType: vehicleType,
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
        const savedBooking = await newBooking.save();
        const pending = new pendingModel({
            userId: id,
            distance: distance,
            pickupLocationName: pickupLocationName,
            time: time,
            username: username,
            destination: destination,
            vehicleType: vehicleType,
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
        })
        await pending.save();
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

//Accept a trip

const acceptTrip = async (req, res) => {
    const { tripId, driverId, userId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId || !userId) {
            return res.status(400).json({ message: 'Data required' });
        }

        // Fetch the driver, booking, user, and driver location by their IDs
        const driverBook = await detailTrip.findOne({ _id: driverId });
        const booking = await bookModel.findOne({ _id: tripId });
        const userData = await user.findOne({ _id: userId });
        const driverLocation = await driverDestination.findOne({ driverId: driverId });

        if (!booking) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        if (!driverBook) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the status to 'accepted'
        booking.status = 'accepted';

        // Find and delete the trip from pendingModel
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        // Save the updated booking
        const updatedBooking = await booking.save();

        // Send the tripAccepted event to both driverId and userId
        if (global.io) {
            console.log(driverId, "===========", userId);
            global.io.emit('tripAccepted', { updatedBooking, driverBook, driverLocation, userData })
            global.io.emit('tripAccepted', { updatedBooking, driverBook, driverLocation, userData });
        }

        res.status(200).json({ updatedBooking, driverBook, driverLocation, userData });
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
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        res.status(200).json({updatedBooking});
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

// Start a trip
const startTrip = async (req, res) => {
    const { tripId, driverId, userId } = req.body;

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
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        const updatedBooking = await booking.save();
        if (global.io) {
            global.io.emit('tripStarted', { updatedBooking, driverBook, userId });
        }
        res.status(200).json({updatedBooking, driverBook});
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: error.message });
    }
};

const arriving = async (req, res) => {
    const { tripId, driverId, userId } = req.body;

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
        booking.status = 'Arriving';
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        const updatedBooking = await booking.save();
        if (global.io) {
            global.io.emit('tripArriving', { updatedBooking, driverBook, userId });
        }
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
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

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
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });

        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

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


const getTripsSocket = (socketIoInstance) => {
    io = getTripsSocket; // Set WebSocket instance
};

const allTrips = async function(req, res){
    try{
        // Fetch all trips
        const trips = await bookModel.find();
        
        // Emit trips to all WebSocket clients
        if(io) {
            io.emit('tripsUpdate', trips); // Notify all connected clients with the updated trips
        }

        // Send response with trips to the client who made the HTTP request
        res.status(200).json(trips);
    } catch(error) {
        console.log(error);
        res.status(500).json({message: 'INTERNAL SERVER ERROR'});
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
    calculateCost,
    cancelledTripbeforestart,
    allTrips,
    getTripsSocket,
    arriving
};
