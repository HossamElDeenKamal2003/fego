const bookModel = require('../../model/booking/userBooking'); // Adjust path to your model
let io;

const tripSocketHandler = (socketIoInstance) => {
    io = socketIoInstance;

    // Watch for changes in the 'bookModel' collection using change streams
    const changeStream = bookModel.watch();

    changeStream.on('change', async (change) => {
        try {
            console.log('Change detected in trips:', change);
            const trips = await bookModel.find(); // Fetch all trips from DB
            io.emit('tripsUpdate', trips); // Emit updated trips to all connected clients
        } catch (error) {
            console.error('Error fetching updated trips:', error);
            io.emit('error', { message: 'INTERNAL SERVER ERROR' });
        }
    });
};

module.exports = tripSocketHandler;
