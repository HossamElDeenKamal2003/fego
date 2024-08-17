const { addOffer } = require('./offers');

const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected');

        // Handle WebSocket offer addition
        socket.on('addOffer', async (data) => {
            const { tripId, driverId, offer } = data;
            if (!tripId || !driverId || !offer) {
                socket.emit('error', { message: 'tripId, driverId, and offer are required' });
                return;
            }

            try {
                const newOffer = new offerModel({ tripId, driverId, offer });
                await newOffer.save();

                // Notify all clients about the new offer
                io.emit('offerAdded', newOffer);
            } catch (error) {
                console.error('Error adding offer:', error);
                socket.emit('error', { message: error.message });
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('A user disconnected');
        });
    });
};

module.exports = socketHandler;
