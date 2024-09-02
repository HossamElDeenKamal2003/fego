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
    const { id, distance, username, driverId, destination, latitude, longitude, destlatitude, destlongtitude, cost,pickupLocationName,time, vehicleType, locationName } = req.body;
    try {
        // Validate input
        if (!id || !distance || !username || !destination || latitude === undefined || longitude === undefined || !locationName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Create new booking with status 'pending'
        const newBooking = new bookModel({
            userId: id,
            distance: distance,
            driverId,
            pickupLocationName: pickupLocationName,
            time: time,
            locationName: locationName,
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
            driverId,
            pickupLocationName: pickupLocationName,
            time: time,
            locationName: locationName,
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
        const driverData = await detailTrip.findOne({_id: driverId})
        if (!booking) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        if (!driverBook) {
            return res.status(404).json({ message: 'Driver not found' });
        }
        if (!userData) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update the booking status to 'accepted' and set the driverId
        booking.status = 'accepted';
        booking.driverId = driverId;
        // Find and delete the trip from pendingModel
        const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
        if (!deletedPendingTrip) {
            console.warn(`Trip ${tripId} not found in pendingModel`);
        }

        // Save the updated booking
        const updatedBooking = await booking.save();

        // Emit the 'tripAccepted' event to both driverId and userId
        if (global.io) {
            global.io.emit(`tripAccepted/${driverId}`, { updatedBooking, driverBook, driverLocation, userData });
        }

        res.status(200).json({ updatedBooking, driverBook, driverLocation, userData });
    } catch (error) {
        console.error(error.message);
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
        if (global.io) {
            global.io.emit(`tripcancellBefore/${tripId}`, { updatedBooking, driverBook, userId });
        }
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
            global.io.emit(`tripStarted/${tripId}`, { updatedBooking, driverBook, userId });
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
            global.io.emit(`tripArriving/${tripId}`, { updatedBooking, driverBook, userId });
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
        if (global.io) {
            global.io.emit(`tripCancell/${tripId}`, { updatedBooking, driverBook, userId });
        }
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
        if (global.io) {
            global.io.emit(`tripEnd/${tripId}`, { updatedBooking, driverBook });
        }
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
            { status: status }, 
            { new: true } 
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

const history = async function(req, res){
    const userId = req.params.id;
    try {
        // Find all trips that are not pending and match the given userId
        const trips = await bookModel.find({ status: { $ne: "pending" }, userId: userId });
        
        // Fetch driver details for each trip
        const tripsWithDriverDetails = await Promise.all(trips.map(async trip => {
            const driverDetail = await detailTrip.findOne({ _id: trip.driverId });
            return { ...trip.toObject(), driverDetail }; // Convert Mongoose document to plain object and include driverDetail
        }));

        // Emit trips with driver details to all WebSocket clients
        if (global.io) {
            global.io.emit('tripsUpdate', tripsWithDriverDetails);
        }

        // Send response with trips to the client who made the HTTP request
        res.status(200).json(tripsWithDriverDetails);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
}

const driverRate = async function(req, res) {
    const { driverId, rate } = req.body;

    try {
        // Find the driver
        const driver = await detailTrip.findById(driverId);
        
        if (!driver) {
            return res.status(404).json({ message: "Driver Not Found" });
        }

        // Calculate the new average rating
        const oldRate = driver.rate || 0;
        const totalRatings = driver.totalRatings || 0;
        const newTotalRatings = totalRatings + 1;
        const newRate = ((oldRate * totalRatings) + rate) / newTotalRatings;

        // Update the driver's rating and totalRatings
        const updatedDriver = await detailTrip.findOneAndUpdate(
            { _id: driverId },
            { 
                rate: newRate,
                totalRatings: newTotalRatings
            },
            { new: true, useFindAndModify: false } 
        );

        res.status(200).json({ 
            message: "Rate Updated Successfully", 
            rate: updatedDriver.rate, 
            totalRatings: updatedDriver.totalRatings 
        });
    } catch (error) {
        console.error(error);
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


const allTrips = async function(req, res, io) {
    try {
        // Fetch all trips with status "pending" from the database
        const trips = await bookModel.find({ status: 'pending' });

        // Emit trips to all WebSocket clients
        if (io) {
            console.log("Emitting trips with status 'pending'");
            io.emit('tripsUpdate', trips);
        }

        // Send response with trips to the client who made the HTTP request
        res.status(200).json(trips);
    } catch (error) {
        console.error('Error fetching trips:', error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};



const getlocation = async function(req, res){
    try{
        const locations = await DestDriver.find();
        if(!location){
            res.status(404).json({message: "No Data"});
        }
        res.status(200).json(locations);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

module.exports = allTrips;

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
    arriving,
    history,
    driverRate,
    getlocation
};
