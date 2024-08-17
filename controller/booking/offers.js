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
        const newOffer = new offerModel({
            tripId,
            driverId,
            offer
        });
        await newOffer.save();

        // Emit offerAdded event via WebSocket
        if (io) {
            io.emit('offerAdded', newOffer);
        }

        res.status(200).json({ message: 'Offer created successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'INTERNAL SERVER ERROR' });
    }
}

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
}

module.exports = {
    addOffer,
    getOffer,
    setSocketInstance
}
