const Driver = require('../../model/regestration/driverModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const driverFind = require('../../model/booking/driversDestination');
//import upload from '../../middlewares/fiels'; // Import the upload middleware

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
            carNumber,
            carColor,
            vehicleType,
            password,
            latitude,
            longitude
        } = req.body;

        // Profile image should be declared after req.files is available
        const licenseImage = req.files?.['licenseImage'] ? req.files['licenseImage'][0].path : null;
        const driver_licence_image = req.files?.['driver_licence_image'] ? req.files['driver_licence_image'][0].path : null;
        const profile_image = req.files?.['profile_image'] ? req.files['profile_image'][0].path : null;

        if (!profile_image || !username || !email || !carModel || !licence_expire_date || !password || !id ) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (!licenseImage || !driver_licence_image) {
            return res.status(400).json({ message: 'All images are required' });
        }

        const existingUser = await Driver.findOne({ $or: [{ email }, { phoneNumber }, { id }] });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const newDriver = new Driver({
            profile_image,
            username,
            phoneNumber,
            email,
            id,
            carNumber,
            carColor,
            carModel,
            licenseImage,
            driver_licence_image,
            licence_expire_date,
            vehicleType,
            password: hashedPassword,
        });

        await newDriver.save();

        const driverLocation = new driverFind({
            driverId: newDriver._id,
            profile_image: newDriver.profile_image,
            username: newDriver.username,
            carModel: newDriver.carModel,
            carNumber: newDriver.carNumber,
            carColor: newDriver.carColor,
            vehicleType: newDriver.vehicleType,
            location: {
                type: "Point",
                coordinates: [longitude, latitude]
            }
        });

        await driverLocation.save();

        const token = jwt.sign({ id: newDriver._id, username: newDriver.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.status(201).json({
            message: 'User created successfully',
            token,
            driver: {
                id: newDriver._id,
                profile_image: newDriver.profile_image,
                username: newDriver.username,
                email: newDriver.email,
                phoneNumber: newDriver.phoneNumber,
                carModel: newDriver.carModel,
                licenseImage: newDriver.licenseImage,
                driver_licence_image: newDriver.driver_licence_image,
                licence_expire_date: newDriver.licence_expire_date,
                vehicleType: newDriver.vehicleType,
                location: driverLocation.location,
                driverId: driverLocation.driverId,
                carNumber: carNumber,
                carColor: carColor
            }
        });
    } catch (error) {
        console.error('Signup error:', error); // Log the full error
        return res.status(500).json({ message: 'Internal server error', error: error.message });
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
        // if(user.block === true){
            const valid = bcrypt.compareSync(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET || "your_jwt_secret_key", { expiresIn: '1h' });

        return res.status(200).json({
            message: 'Login successful',
            token,
            driver: {
                id: user._id,
                profile_image: user.profile_image,
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
    //}
    //res.status(401).json({message: "Not Authorized to login"});
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
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

const patchBlock = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newBlockValue = !user.block;
        const updatedUser = await Driver.findOneAndUpdate(
            { _id: userId },           
            { block: newBlockValue },   
            { new: true }               
        );
        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

const patchAlerts = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Increment the alerts count
        const updatedUser = await Driver.findOneAndUpdate(
            { _id: userId },
            { $inc: { alerts: 1 } },  
            { new: true }
        );

        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error("Error updating alerts:", error);
        res.status(500).json({ message: error.message });
    }
}

const DeleteUser = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await Driver.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }
        res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const driverLocation = async function(req, res){
    const userId = req.params.id;
    try{
        const driverLocation = await driverFind.findOne();
        // if(!driverLocation){
        //     res.status(404).json({message: "Driver Not Found"});
        // }
        res.status(200).json(driverLocation);
    }
    catch(error){
        console.log(error);
        res.status(500).json(error.message);
    }
}
module.exports = {
    signup,
    login,
    updatePassword,
    patchBlock,
    DeleteUser,
    patchAlerts,
    driverLocation
};
