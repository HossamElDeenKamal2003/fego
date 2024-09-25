const bookModel = require('../../model/booking/userBooking'); // Adjust path to your model
let io;

const tripSocketHandler = (socketIoInstance) => {
    io = socketIoInstance;

    // Function to fetch and emit trips
    const emitTrips = async () => {
        try {
            const trips = await bookModel.find(); // Fetch all trips from DB
            io.emit('tripsUpdate', trips); // Emit updated trips to all connected clients
        } catch (error) {
            console.error('Error fetching trips:', error);
            io.emit('error', { message: 'INTERNAL SERVER ERROR' });
        }
    };

    // Listen for connections
    io.on('connection', (socket) => {
        console.log('A user connected for trips');

        // Emit trips initially
        emitTrips();

        // Set up change stream to watch for changes in the trip collection
        const changeStream = bookModel.watch();

        changeStream.on('change', async (change) => {
            console.log('Change detected:', change);
            // Emit updated trips data on change
            emitTrips();
        });

        // Handle custom events from clients
        socket.on('requestTripUpdate', async () => {
            console.log('Client requested trip update');
            emitTrips(); // Emit trips data when requested
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected');
            changeStream.close(); // Close change stream when client disconnects
        });
    });
};

module.exports = tripSocketHandler;