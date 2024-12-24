const express = require('express');
const router = express.Router();

// Import the order controller functions
const { 
    createOrder, 
    updateOrder, 
    deleteOrder, 
    getMyOrders 
} = require('../controller/ordersController');

// Route for creating a new order (POST)
router.post('/create', createOrder);

// Route for updating an existing order (PATCH)
router.patch('/update/:orderId', updateOrder);

// Route for deleting an order (DELETE)
router.delete('/delete/:orderId', deleteOrder);

// Route for getting all orders for a specific user (GET)
router.get('/my-orders/:id', getMyOrders);

module.exports = router;
