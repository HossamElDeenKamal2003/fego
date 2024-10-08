// tripsPending.js
const getTripDriver = require('./userBooking'); // Ensure this path is also correct

const handleSocketConnection = (io) => {
    io.on('connection', (socket) => {
        console.log('Client connected:', socket.id);

        // Listen for events when a driver connects
        socket.on('subscribe-driver', async (driverId) => {
            console.log(`Driver ${driverId} subscribed for trips`);
            
            // Call the getTripDriver function when the driver subscribes to receive trips
            await getTripDriver(driverId); // Pass driverId correctly here

            // Optionally, you can set up additional listeners for real-time location updates or new trips
        });

        // Handle when the driver disconnects
        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

module.exports = handleSocketConnection; // Export the function directly
