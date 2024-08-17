const offerModel = require('../../model/booking/offers');

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
                // Upsert the offer
                const upsertedOffer = await offerModel.findOneAndUpdate(
                    { tripId, driverId },
                    { offer },
                    { new: true, upsert: true } // Return the updated document and insert if it doesn't exist
                );

                // Notify all clients about the offer
                io.emit('offerAdded', upsertedOffer);
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
