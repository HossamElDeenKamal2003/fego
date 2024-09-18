const mongoose = require('mongoose');
const PricesModel = require('../../model/booking/prices');

const putPrices = async function(req, res) {
    const { country, priceCar, motorocycle, priceVan } = req.body;
    try {
        if (!country || !priceCar || !motorocycle || !priceVan) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const sendPrices = new PricesModel({
            country,
            priceCar,
            motorocycle,
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

        const updatePrice = await PricesModel.updateMany({}, {
            country,
            priceCar,
            motorocycle,
            priceVan
        });

        if (updatePrice.modifiedCount === 0) {
            return res.status(404).json({ message: 'No prices were updated' });
        }

        return res.status(200).json({ message: 'Prices updated successfully', updatePrice });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ message: error.message });
    }
};

const getPrices = async function(req, res) {
    const { country } = req.params; // Destructure the country parameter from req.params
    try {
        const pricesData = await PricesModel.find({ country }); // Use a different name for the result of the query
        if (!pricesData || pricesData.length === 0) {
            return res.status(404).json({ message: 'No prices found for the specified country' });
        }
        res.status(200).json(pricesData);
    } catch (error) {
        console.log('Error:', error.message);
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    putPrices,
    patchPrices,
    getPrices
};
