const bookModel = require('../../model/booking/userBooking'); // Adjust path to your model

let io;

const tripSocketHandler = (socketIoInstance) => {
    io = socketIoInstance; // Set the global io instance

    io.on('connection', (socket) => {
        console.log('A user connected for trips');

        // Emit all trips when a user connects
        socket.emit('getAllTrips', async () => {
            try {
                const trips = await bookModel.find(); // Fetch all trips from DB
                socket.emit('tripsUpdate', trips); // Emit trips to the connected user
            } catch (error) {
                console.error('Error fetching trips:', error);
                socket.emit('error', { message: 'INTERNAL SERVER ERROR' });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected from trips');
        });
    });
};

module.exports = tripSocketHandler;
