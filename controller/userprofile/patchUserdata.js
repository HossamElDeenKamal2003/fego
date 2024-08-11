const User = require('../../model/regestration/userModel');

const updateEmail = async function(req, res) {
    const id = req.params.id;
    const { email } = req.body; // Extract email from request body

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        // Update the user's email by ID
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { email }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Email updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error); 
        return res.status(500).json({ message: error.message });
    }
}

const updateUsername = async function(req, res) {
    const id = req.params.id;
    const { username } = req.body; 

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { username }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Username updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

const updatePhoneNumber = async function(req, res) {
    const id = req.params.id;
    const { phoneNumber } = req.body; // Extract phoneNumber from request body

    if (!phoneNumber) {
        return res.status(400).json({ message: 'Phone number is required' });
    }

    try {
        const updatedUser = await User.findByIdAndUpdate(
            id,
            { phoneNumber }, 
            { new: true } 
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            message: 'Phone number updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: error.message });
    }
}

module.exports = {
    updateEmail,
    updateUsername,
    updatePhoneNumber
}
