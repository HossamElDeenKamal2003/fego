const bookModel = require('../../../model/booking/userBooking');
const driverDestination = require('../../../model/booking/driversDestination');
const detailTrip = require('../../../model/regestration/driverModel');
const pendingModel = require('../../../model/booking/pendingTrips');

const tripStatusHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected Accepted Trip');

        // Handle acceptTrip event
        socket.on('acceptTrip', async (data) => {
            try {
                console.log('Data received:', data);
                const { tripId, driverId } = data;

                // Validate input
                // if (!tripId || !driverId) {
                //     socket.emit('acceptTripResponse', { error: 'Trip ID and Driver ID are required' });
                //     return;
                // }

                // Fetch the driver and booking by their IDs
                const driver = await detailTrip.findOne({ _id: driverId });
                const tripBooking = await bookModel.findOne({ _id: tripId });
                const driverLocation = await driverDestination.findOne({ driverId: driverId });

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
                const deletedPendingTrip = await pendingModel.findOneAndDelete({ _id: tripId });
                if (!deletedPendingTrip) {
                    console.warn(`Trip ${tripId} not found in pendingModel`);
                }

                // Save the updated booking
                const updatedBooking = await tripBooking.save();

                // Notify the client
                socket.emit('acceptTripResponse', { updatedBooking, driver, driverLocation });

                // Notify all clients about the trip update
                io.emit('tripUpdated', { updatedBooking, driver, driverLocation });

            } catch (error) {
                console.error(error.message);
                socket.emit('acceptTripResponse', { error: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log('User disconnected');
        });
    });
};

module.exports = tripStatusHandler;
