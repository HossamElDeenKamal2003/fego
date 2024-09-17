const paytabsModel = require('../../../model/banking/paytabs');

// app.js
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());

// Replace with your PayTabs merchant details
const PAYTABS_BASE_URL = 'https://merchant-egypt.PayTabs.com'; // Egyptian region
const SERVER_KEY = 'SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH';

// Endpoint to initiate payment
const paytabs = async function(req, res) {
    const { username, email, phoneNumber, amount, cardId } = req.body;
    try {
        const paymentData = {
            profile_id: 'STJ9NJNMKN-JJWL2MDDHK-KZDJJG9JGT CKK2M9-2P9766-VBMNDD-QNR6DD', // From PayTabs account
            tran_type: 'sale',             // For direct payment
            tran_class: 'ecom',            // For e-commerce transactions
            cart_id: req.body.cardId,         // Unique identifier for your transaction
            cart_description: 'Test Cart',
            cart_currency: 'EGP',          // Adjust based on your currency
            cart_amount: amount,           // Amount to charge
            customer_details: {
                name: username,
                email: email,
                phone: phoneNumber,
                country: 'EGY',
                zip: '12345',
            },

            //Uncomment and replace these URLs with your real callback and return URLs
            // callback: 'https://yourdomain.com/callback', // Your callback URL
            // return: 'https://yourdomain.com/success'     // URL to redirect after success
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${SERVER_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        // Save the transaction to the database
        const newTransaction = new paytabsModel({
            driverName: username,
            phoneNumber: phoneNumber,
            email: email,
            cardId: cardId,
            transactionAmount: amount,  // Corrected the typo
        });
        
        // Await the save function to handle possible errors
        await newTransaction.save();

        // Make the payment request to PayTabs
        const response = await axios.post(PAYTABS_BASE_URL, paymentData, config);

        // Respond with the created payment data
        res.status(200).json({
            message: 'Payment created successfully',
            data: response.data,
            transaction: newTransaction,
        });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({
            message: 'Payment creation failed',
            error: error.response ? error.response.data : error.message,
        });
    }
};

// Export the paytabs function
module.exports = {paytabs};
