const orders = require('../model/createOrder');

// Create a new order
const createOrder = async function(req, res) {
    const { userId, organizationId, day } = req.body;
    try {
        if (!userId || !organizationId || !day) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const newOrder = new orders({
            userId,
            organizationId,
            day
        });

        await newOrder.save();
        res.status(200).json({ order: newOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Update an order (PATCH)
const updateOrder = async function(req, res) {
    const { orderId } = req.params; // Assume orderId is passed in params
    const updateData = req.body; // Data to update

    try {
        const updatedOrder = await orders.findByIdAndUpdate(orderId, updateData, { new: true });
        
        if (!updatedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order updated successfully", order: updatedOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

// Delete an order (DELETE)
const deleteOrder = async function(req, res) {
    const { orderId } = req.params;

    try {
        const deletedOrder = await orders.findByIdAndDelete(orderId);
        
        if (!deletedOrder) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.status(200).json({ message: "Order deleted successfully", order: deletedOrder });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

const getMyOrders = async function(req, res) {
    const userId = req.params.id; // Assuming the userId is passed as a URL parameter
    try {
        // Find all orders associated with the given userId
        const userOrders = await orders.find({ userId: userId });
        
        // If no orders are found, return a 404 error
        if (!userOrders || userOrders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }

        // If orders are found, return them in the response
        res.status(200).json({ orders: userOrders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    updateOrder,
    deleteOrder,
    getMyOrders
};
