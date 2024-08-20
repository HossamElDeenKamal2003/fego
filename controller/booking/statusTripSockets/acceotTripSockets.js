const bookModel = require('../../../model/booking/userBooking');
const driverDestination = require('../../../model/booking/driversDestination');
const detailTrip = require('../../../model/regestration/driverModel');
const pendingModel = require('../../../model/booking/pendingTrips');

const tripStatusHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected for trip status updates');

        // Handle acceptTrip event
        socket.on('acceptTrip', async (data) => {
            const tripId = data.tripId;

            try {
                const tripBooking = await bookModel.findById(tripId);

                if (!tripBooking) {
                    socket.emit('acceptTripResponse', { error: 'Trip not found' });
                    return;
                }

                // Update the status to 'accepted'
                tripBooking.status = 'accepted';

                // Find and delete the trip from pendingModel
                const deletedPendingTrip = await pendingModel.findByIdAndDelete(tripId);
                if (!deletedPendingTrip) {
                    console.warn(`Trip ${tripId} not found in pendingModel`);
                }

                // Save the updated booking
                const updatedBooking = await tripBooking.save();

                // Notify the client who made the request
                socket.emit('acceptTripResponse', { updatedBooking });

                // Notify all clients about the trip update
                io.emit('tripUpdated', { updatedBooking });

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

const driverDataHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('Connection to get driver data');
        
        socket.on('getDriverData', async (data) => {
            const driverId = data;

            if (!driverId) {
                socket.emit('driverDataResponse', { error: 'Driver ID is required' });
                return;
            }

            try {
                const findDriver = await detailTrip.findById(driverId);
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
