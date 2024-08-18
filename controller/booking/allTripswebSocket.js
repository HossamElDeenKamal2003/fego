const bookModel = require('../../model/booking/userBooking'); // Adjust path to your model

let io;

const tripSocketHandler = (socketIoInstance) => {
    io = socketIoInstance; // Set the global io instance

    io.on('connection', (socket) => {
        console.log('A user connected for trips');

        // Function to emit trips data to all connected clients
        const emitTrips = async () => {
            try {
                const trips = await bookModel.find(); // Fetch all trips from DB
                io.emit('tripsUpdate', trips); // Emit trips to all connected clients
            } catch (error) {
                console.error('Error fetching trips:', error);
                io.emit('error', { message: 'INTERNAL SERVER ERROR' });
            }
        };

        emitTrips(); // Initial emit

        // Set up change stream to watch for changes in the collection
        const changeStream = bookModel.watch();
        changeStream.on('change', (change) => {
            emitTrips(); // Emit trips data on change
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected from trips');
            changeStream.close(); // Close change stream when user disconnects
        });
    });
};

module.exports = tripSocketHandler;
