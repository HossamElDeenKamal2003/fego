const Driver = require('../../model/regestration/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');

// Sign-up function
const signup = async function(req, res) {
    try {
        const {
            username,
            phoneNumber,
            email,
            id,
            carModel,
            licence_expire_date,
            vehicleType,
            password
        } = req.body;

        // Ensure all required fields are provided
        if (!username || !email || !carModel || !licence_expire_date || !password || !id) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Handle file uploads
        const licenseImage = req.files['licenseImage'] ? req.files['licenseImage'][0].path : null;
        const driver_licence_image = req.files['driver_licence_image'] ? req.files['driver_licence_image'][0].path : null;

        if (!licenseImage || !driver_licence_image) {
            return res.status(400).json({ message: 'Both images are required' });
        }

        // Construct URLs for images
        const hostname = `${req.protocol}://${req.get('host')}`;
        const licenseImageUrl = `${hostname}/${path.basename(licenseImage)}`;
        const driverLicenceImageUrl = `${hostname}/${path.basename(driver_licence_image)}`;

        // Check if the user already exists
        const existingUser = await Driver.findOne({ $or: [{ email }, { phoneNumber }, { id }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new driver
        const newDriver = new Driver({
            username,
            phoneNumber,
            email,
            id,
            carModel,
            licenseImage: licenseImageUrl,
            driver_licence_image: driverLicenceImageUrl,
            licence_expire_date,
            vehicleType,
            password: hashedPassword
        });

        await newDriver.save();

        // Generate a JWT token
        const token = jwt.sign({ id: newDriver._id, username: newDriver.username }, process.env.JWT_SECRET || "your_jwt_secret_key", { expiresIn: '1h' });

        return res.status(201).json({
            message: 'User created successfully',
            token,
            driver: {
                id: newDriver._id,
                username: newDriver.username,
                email: newDriver.email,
                phoneNumber: newDriver.phoneNumber,
                carModel: newDriver.carModel,
                licenseImage: newDriver.licenseImage,
                driver_licence_image: newDriver.driver_licence_image,
                licence_expire_date: newDriver.licence_expire_date,
                vehicleType: newDriver.vehicleType,
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Login function
const login = async function(req, res) {
    const { email, phoneNumber, password } = req.body;

    if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({ message: 'Email or phone number and password are required' });
    }

    try {
        const user = await Driver.findOne({ $or: [{ email }, { phoneNumber }] });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || "your_jwt_secret_key", { expiresIn: '1h' });

        return res.status(200).json({
            message: 'Login successful',
            token,
            driver: {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber,
                carModel: user.carModel,
                licenseImage: user.licenseImage,
                driver_licence_image: user.driver_licence_image,
                licence_expire_date: user.licence_expire_date,
                vehicleType: user.vehicleType
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

// Update password function
const updatePassword = async function(req, res) {
    const { email, phoneNumber, currentPassword, newPassword } = req.body;

    if ((!email && !phoneNumber) || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Email or phone number, current password, and new password are required' });
    }

    try {
        const user = await Driver.findOne({ $or: [{ email }, { phoneNumber }] });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Update password error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    signup,
    login,
    updatePassword,
};
