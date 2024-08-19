const bookModel = require('../../../model/booking/userBooking');
const driverDestination = require('../../../model/booking/driversDestination');
const detailTrip = require('../../../model/regestration/driverModel');
const pendingModel = require('../../../model/booking/pendingTrips');

const tripStatusHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected for trip status updates');

        // Handle acceptTrip event
        socket.on('acceptTrip', async (data) => {
            console.log('Received data:', data);

            const { tripId, driverId } = data;

            // Validate input
            if (!tripId || !driverId) {
                console.log(`Validation failed: tripId=${tripId}, driverId=${driverId}`);
                socket.emit('acceptTripResponse', { error: 'Trip ID and Driver ID are required' });
                return;
            }

            try {
                console.log('Data for database lookup:', { tripId, driverId });

                // Fetch the driver and booking by their IDs
                const driver = await detailTrip.findById(driverId);
                const tripBooking = await bookModel.findById(tripId);
                const driverLocation = await driverDestination.findOne({ driverId });

                if (!tripBooking) {
                    socket.emit('acceptTripResponse', { error: 'Trip not found' });
                    return;
                }
                if (!driver) {
                    socket.emit('acceptTripResponse', { error: 'Driver not found' });
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
                socket.emit('acceptTripResponse', { updatedBooking, driver, driverLocation });

                // Notify all clients about the trip update
                io.emit('tripUpdated', { updatedBooking, driver, driverLocation });

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

module.exports = tripStatusHandler;
