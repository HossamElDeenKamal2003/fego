const mongoose = require('mongoose');
const driverDestination = require('../../model/booking/driversDestination');
const detailTrip = require('../../model/regestration/driverModel.js');
const pendingModel = require('../../model/booking/pendingTrips.js')
const booking = require('../../model/booking/userBooking.js');
const bookModel = require('../../model/booking/userBooking.js');
const DestDriver = require('../../model/booking/driversDestination.js');
const user = require('../../model/regestration/userModel.js');
const http = require('http');
const server = http.createServer();
const { Server } = require("socket.io");
const io = new Server(server);
const Distance = require('../../model/booking/maxDistance.js');
const offers = require('../../model/booking/offers.js');
const PricesModel = require('../../model/booking/prices.js');
const sendNotification = require('../../firebase.js'); // Import the sendNotification function

let connectedClients = {};
const findDrivers = async (vehicleType, latitude, longitude) => {
    if (!vehicleType || latitude === undefined || longitude === undefined) {
        throw new Error('Vehicle type, latitude, and longitude are required');
    }

    try {
        const settings = await Distance.findOne({});
        const maxDistance = settings ? settings.maxDistance : 5000; // Default to 5km if not set

        // Use the MongoDB aggregation pipeline to calculate distance between client and drivers
        const drivers = await driverDestination.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [longitude, latitude]
                    },
                    distanceField: "distance", // This will return the calculated distance in meters
                    spherical: true,
                    maxDistance: maxDistance,
                    query: { vehicleType } // Filter by vehicle type
                }
            }
        ]);

        if (drivers.length === 0) {
            throw new Error('No drivers available in your area');
        }

        // Find detailed information for each nearby driver and include the distance
        const driverDetails = await Promise.all(
            drivers.map(async (driver) => {
                const detail = await detailTrip.findOne({ _id: driver.driverId });
                return {
                    ...driver,
                    ...detail?.toObject(), // Include additional driver details
                    distance: driver.distance // Include calculated distance
                };
            })
        );

        return driverDetails;

    } catch (error) {
        console.error('Error finding drivers:', error);
        throw error;
    }
};


const updateDistance = async function(req, res) {
    const { maxDistance } = req.body;

    try {
        // Ensure maxDistance is provided
        if (!maxDistance) {
            return res.status(400).json({ message: "maxDistance is required" });
        }

        // Update the document by its _id
        const result = await Distance.findOneAndUpdate(
            { _id: "66cc4dd383ebb7ad1147a518" },  // Ensure this ID is correct
            { maxDistance: maxDistance },
            { new: true }  // Return the updated document
        );

        // Check if the update was successful
        if (!result) {
            return res.status(404).json({ message: "Distance data not found" });
        }

        // Send the updated document in the response
        res.status(200).json({ message: "Distance updated successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getDistance = async function(req, res){
    try{
        const distance = await Distance.findOne({});
        if(!distance){
            res.status(404).json({message: "No Data For Distance"});
        }
        res.status(200).json({message: distance});
    }
    catch(error){
        console.log(error);
    }
}

// Book a trip
const bookTrip = async (req, res) => {
    const {
        id, distance, username, driverId, destination, latitude, longitude,
        destlatitude, destlongtitude, cost, pickupLocationName, time, vehicleType,
        locationName, uniqueId
    } = req.body;

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
            uniqueId,
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
            destinationLocation: {
                type: "Point",
                coordinates: [destlongtitude, destlatitude]
            },
            cost: cost,
            status: 'pending' // Initial status
        });

        const savedBooking = await newBooking.save();

        // Save in pending model
        const pending = new pendingModel({
            userId: id,
            distance: distance,
            driverId,
            uniqueId,
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
            destinationLocation: {
                type: "Point",
                coordinates: [destlongtitude, destlatitude]
            },
            cost: cost,
            status: 'pending'
        });
        await pending.save();

        // Find drivers using the findDrivers function
        const availableDrivers = await findDrivers(vehicleType, latitude, longitude);

        if (availableDrivers.length === 0) {
            return res.status(404).json({ message: 'No drivers available in your area with the specified vehicle type.' });
        }

        // Debugging: Log available drivers and their details
        console.log('Available Drivers:', availableDrivers);

        // Send notification to all available drivers
        for (const driver of availableDrivers) {
            // Check if the driver has an FCM token saved in the database
            const driverFCMToken = 'dJArw3O4TT-OyIw31zjbUV:APA91bE6UeJzoKRLAIU-ONh12KK82Lvy128k37sh0W6aZl_cNdV1B6cCySTGjO_NXdbdONAeCmJ9SFwpiGC7oPDVj4tyBHEToVUcsFiEgdgN0U-L3xpgDZ4em5iP4UA84xxQwzCx3KvN' // Assuming drivers have an 'fcmToken' field

            if (driverFCMToken) {
                const notificationMessage = {
                    title: 'New Trip Available',
                    body: `A new trip to ${destination} is available for you.`,
                };

                // Send the FCM notification to the driver
                sendNotification(driverFCMToken, notificationMessage);
            } else {
                console.log(`Driver ${driver.username} does not have an FCM token.`);
            }
        }

        // Update booking status to 'pending'
        savedBooking.status = 'pending';
        const updatedBooking = await savedBooking.save();

        // Return the updated booking and available drivers
        return res.status(200).json({
            booking: updatedBooking,
            availableDrivers
        });

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
    const { tripId, driverId, userId, offerId } = req.body;

    try {
        // Validate input
        if (!tripId || !driverId || !userId || !offerId) {
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
        const offer = await offers.findOne({_id: offerId});
        booking.status = 'accepted';
        booking.cost = offer.offer || booking.cost;
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



const cancelledTripbeforestart = async function(req, res) {
    const { tripId } = req.body;
    
    try {
        if (!tripId) {
            return res.status(400).json({ message: 'Trip ID is required' });
        }

        // Find and update the booking
        const booking = await bookModel.findOneAndUpdate({ _id: tripId },  { status: 'cancelled' }, { new: true });

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        //booking.status = 'cancelled';
        //const updatedBooking = await booking.save();

        // Delete from pending model
        // const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
        // if (!deletedPendingTrip) {
        //     console.warn(`Trip ${tripId} not found in pendingModel`);
        // }

        // Emit cancellation event
        if (global.io) {
            // Ensure driverBook and userId are defined or passed correctly
            global.io.emit(`tripcancellBefore/${tripId}`, { booking }); // Assuming driverBook and userId should be included if defined
        }

        // Respond with updated booking
        res.status(200).json({ booking });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


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

const driverHistory = async function(req, res) {
    const driverId = req.params.id;
    try {
        // Fetch driver trips
        const driverTrips = await booking.find({ driverId: driverId });

        // Check if trips were found
        if (!driverTrips || driverTrips.length === 0) {
            return res.status(404).json({ message: "No Trips" });
        }

        // Extract user IDs from the driverTrips
        const userIds = driverTrips.map(trip => trip.userId);

        // Fetch user data for all unique user IDs
        const uniqueUserIds = Array.from(new Set(userIds));
        const userData = await user.find({ _id: { $in: uniqueUserIds } });

        // Create a map of user data for quick lookup
        const userMap = userData.reduce((map, user) => {
            map[user._id] = user;
            return map;
        }, {});

        // Attach user data to each trip
        const tripsWithUserData = driverTrips.map(trip => ({
            ...trip.toObject(),
            userData: userMap[trip.userId] || null
        }));

        // Respond with trips and user data
        res.status(200).json({ tripsWithUserData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
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

const addPrice = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan } = req.body;
    
    try {
        // Check for missing fields
        if (!country || !priceCar || !motorocycle || !priceVan) {
            return res.status(400).json({ message: "All Fields Required" });
        }

        const newPrice = new PricesModel({
            country,
            priceCar,
            motorocycle,
            priceVan,
        });

        await newPrice.save();
        res.status(201).json({ message: "Price Added Successfully", newPrice });
    } catch (error) {
        console.error(error); // Use console.error for errors
        res.status(500).json({ message: error.message });
    }
};

const getPrice = async function(req, res){
    try{
        const prices = await PricesModel.find();
        res.status(200).json(prices);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const updatePrice = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan } = req.body;
    
    try {
        if (!country) {
            return res.status(400).json({ message: "Country not found" });
        }

        const updatedPrice = await PricesModel.findOneAndUpdate(
            { country: country },
            { priceCar, motorocycle, priceVan },
            { new: true }
        );

        if (!updatedPrice) {
            return res.status(404).json({ message: "Pricing data not found" });
        }

        res.status(200).json({ message: "Pricing Updated Successfully", updatedPrice });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

const deletePrice = async function(req, res) {
    const { country } = req.body;
    try {
        // Ensure the country field is provided
        if (!country) {
            return res.status(400).json({ message: "Country is required" });
        }

        // Attempt to delete the document
        const result = await PricesModel.findOneAndDelete({ country: country });

        // Check if a document was deleted
        if (!result) {
            return res.status(404).json({ message: "Pricing data not found" });
        }

        res.status(200).json({ message: "Price Deleted Successfully" });
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

const updateCost = async function(req, res) {
    const { tripId, cost } = req.body;

    try {
        // Validate input
        if (!tripId || !cost) {
            return res.status(400).json({ message: "All Data Required" });
        }

        // Update the trip's cost
        const trip = await bookModel.findOneAndUpdate(
            { _id: tripId },
            { cost: cost },
            { new: true } // To return the updated document
        );

        if (!trip) {
            return res.status(404).json({ message: "Trip not found" });
        }

        // Emit event to update cost in real-time
        if (global.io) {
            global.io.emit('trip-updated', trip);
        }

        // Respond with success message and the updated trip
        res.status(200).json({ message: "Cost Updated Successfully", trip });
    } catch (error) {
        console.error(error);
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
        if(!locations){
            res.status(404).json({message: "No Data"});
        }
        res.status(200).json(locations);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

const costHandler = (io) => {
    io.on("connection", (socket) => {
        console.log("Connected To Update Cost");

        socket.on("update-price", async (data) => {
            const { tripId, cost } = data; // Extract tripId and cost from the received data

            if (!tripId || typeof cost !== 'number') {
                socket.emit('error', { message: 'tripId and valid cost are required' });
                return;
            }

            try {    
                const trip = await bookModel.findOneAndUpdate(
                    { _id: tripId },
                    { cost: cost },
                    { new: true }
                );

                if (!trip) {
                    socket.emit('error', { message: 'Trip not found' });
                    return;
                }

                // Emit the updated cost to all connected clients
                io.emit(`get-cost/${tripId}`, {
                    cost: trip.cost
                });
            } catch (error) {
                console.log('Error updating cost:', error);
                socket.emit('error', { message: 'Error when updating price' });
            }
        });
    });
};

module.exports = costHandler;


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
    getlocation,
    costHandler,
    updateCost,
    driverHistory,
    addPrice,
    updatePrice,
    getPrice,
    deletePrice,
    updateDistance,
    getDistance
};
