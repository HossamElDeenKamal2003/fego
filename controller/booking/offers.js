const offerModel = require('../../model/booking/offers');

let io;

const setSocketInstance = (socketIoInstance) => {
    io = socketIoInstance;
};

const addOffer = async function(req, res) {
    const { tripId, driverId, offer } = req.body;
    try {
        if (!tripId || !driverId) {
            return res.status(400).json({ message: 'tripId and driverId are required' });
        }

        // Use upsert to update or create offer
        const upsertedOffer = await offerModel.findOneAndUpdate(
            { tripId, driverId },
            { offer },
            { new: true, upsert: true } // Return the updated document and insert if it doesn't exist
        );

        // Emit offerAdded event via WebSocket
        if (io) {
            io.emit('offerAdded', upsertedOffer);
        }

        res.status(200).json({ message: 'Offer upserted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
};

const getOffer = async function(req, res) {
    const { tripId } = req.body;
    try {
        if (!tripId) {
            return res.status(400).json({ message: 'tripId is required' });
        }
        const offers = await offerModel.find({ tripId });
        res.status(200).json({ offers });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    addOffer,
    getOffer,
    setSocketInstance
};
