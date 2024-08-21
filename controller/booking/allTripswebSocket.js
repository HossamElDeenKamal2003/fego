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
                socket.emit('error', { message: 'INTERNAL SERVER ERROR' });
            }
        };

        // Emit all trips initially when a user connects
        emitTrips();

        // Set up change stream to watch for changes in the trip collection
        const changeStream = bookModel.watch();

        changeStream.on('change', async (change) => {
            console.log('Change detected:', change);
            // Emit updated trips data on change
            emitTrips();
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected from trips');
            // It's good practice to close the change stream when a client disconnects
            changeStream.close();
        });
    });
};

module.exports = tripSocketHandler;
