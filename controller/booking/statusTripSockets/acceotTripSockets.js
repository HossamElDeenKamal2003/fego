const bookModel = require('../../../model/booking/userBooking');
const driverDestination = require('../../../model/booking/driversDestination');
const detailTrip = require('../../../model/regestration/driverModel');
const pendingModel = require('../../../model/booking/pendingTrips');
const mongoose = require('mongoose');  // Ensure mongoose is imported

const tripStatusHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected for trip status updates');

        // Handle acceptTrip event  
        socket.on('acceptTrip', async (data) => {
            const tripId = data.tripId;
            const driverId = data.driverId ? new mongoose.Types.ObjectId(data.driverId) : null;
            console.log('before try',tripId, driverId);
            try {
                console.log('after try', tripId, driverId);
                const tripBooking = await bookModel.findById(tripId);

                if (!tripBooking) {
                    socket.emit('acceptTripResponse', { error: 'Trip not found' });
                    return;
                }

                // Update the status to 'accepted'
                tripBooking.status = 'accepted';
                const findDriver = await detailTrip.findOne({ _id: driverId });
                const driverLocation = await driverDestination.findOne({ driverId: driverId });

                if (!findDriver) {
                    socket.emit('driverDataResponse', { error: 'Driver not found' });
                    return;
                }
                
                if (!driverLocation) {
                    socket.emit('driverDataResponse', { error: 'Driver location not found' });
                    return;
                }
                // Find and delete the trip from pendingModel
                const deletedPendingTrip = await pendingModel.findByIdAndDelete(tripId);
                if (!deletedPendingTrip) {
                    console.warn(`Trip ${tripId} not found in pendingModel`);
                }

                // Save the updated booking
                const updatedBooking = await tripBooking.save();

                // Notify the client who made the request
                socket.emit('acceptTripResponse', { updatedBooking, findDriver, driverLocation });

                // Notify all clients about the trip update
                io.emit('tripUpdated', { updatedBooking, findDriver, driverLocation });

            } catch (error) {
                console.error('Error in acceptTrip handler:', error.message);
                socket.emit('acceptTripResponse', { error: 'An error occurred while processing the trip' });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

//const mongoose = require('mongoose');  // Ensure mongoose is imported

const driverDataHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('Connection to get driver data');
        
        socket.on('getDriverData', async (data) => {
            // Extract and convert driverId to ObjectId
            const driverId = data.driverId ? new mongoose.Types.ObjectId(data.driverId) : null;

            if (!driverId) {
                socket.emit('driverDataResponse', { error: 'Valid Driver ID is required' });
                return;
            }

            try {
                // Fetch the driver and driver location by their ObjectId
                const findDriver = await detailTrip.findOne({ _id: driverId });
                const driverLocation = await driverDestination.findOne({ driverId: driverId });

                if (!findDriver) {
                    socket.emit('driverDataResponse', { error: 'Driver not found' });
                    return;
                }
                
                if (!driverLocation) {
                    socket.emit('driverDataResponse', { error: 'Driver location not found' });
                    return;
                }

                // Send the driver data back to the client
                socket.emit('driverDataResponse', { findDriver, driverLocation });

            } catch (error) {
                console.error('Error in getDriverData handler:', error.message); 
                socket.emit('driverDataResponse', { error: 'An error occurred while fetching the driver data' });
            }
        });
    });
};


module.exports = {
    tripStatusHandler,
    driverDataHandler
};
