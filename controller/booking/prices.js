const mongoose = require('mongoose');
const prices = require('../../model/booking/prices');

const putPrices = async function(req, res) {
    const { country, priceCar, priceBus, priceVan } = req.body;
    try {
        if (!country || !priceCar || !priceBus || !priceVan) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const sendPrices = new prices({
            country,
            priceCar,
            priceBus,
            priceVan
        });

        await sendPrices.save();
        return res.status(200).json({ message: 'Prices sent successfully' });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

const patchPrices = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan } = req.body;
    try {
        if (!country || !priceCar || !motorocycle || !priceVan) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const updatePrice = await prices.updateMany({}, {
            country,
            priceCar,
            motorocycle,
            priceVan
        });

        if (updatePrice.nModified === 0) {
            return res.status(404).json({ message: 'No prices were updated' });
        }

        return res.status(200).json({ message: 'Prices updated successfully', updatePrice });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    putPrices,
    patchPrices
};
