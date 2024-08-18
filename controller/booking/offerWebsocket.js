const offerModel = require('../../model/booking/offers');
const Driver = require('../../model/regestration/driverModel.js');

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

                const driver = await Driver.findById(driverId);
                if (!driver) {
                    socket.emit('error', { message: 'Driver not found' });
                    return;
                }

                // Convert timestamps to Egypt time zone
                const options = { 
                    timeZone: 'Africa/Cairo', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: 'numeric', 
                    second: 'numeric' 
                };

                const formattedOffer = {
                    ...upsertedOffer.toObject(),
                    createdAt: new Date(upsertedOffer.createdAt).toLocaleString('en-US', options),
                    updatedAt: new Date(upsertedOffer.updatedAt).toLocaleString('en-US', options)
                };

                // Emit offerAdded event via WebSocket
                if (io) {
                    io.emit('offerAdded', { offer: formattedOffer, driver });
                }

                // Schedule the offer to be deleted after 30 seconds
                setTimeout(async () => {
                    try {
                        await offerModel.findByIdAndDelete(upsertedOffer._id);
                        const formattedOffer = {
                            ...upsertedOffer.toObject(),
                            createdAt: new Date(upsertedOffer.createdAt).toLocaleString('en-US', options),
                            updatedAt: new Date(upsertedOffer.updatedAt).toLocaleString('en-US', options)
                        };
                        io.emit('offerDeleted', { offerId: upsertedOffer._id, formattedOffer });
                    } catch (error) {
                        console.error('Error deleting offer:', error);
                    }
                }, 30000); // 30000 milliseconds = 30 seconds, each second is 1000 millsecond

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
