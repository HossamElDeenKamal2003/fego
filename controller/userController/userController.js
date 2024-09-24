const axios = require('axios');
const User = require('../../model/regestration/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating random OTP
const bcrypt = require('bcrypt'); // Make sure to install bcryptjs

// SMSMISR API configuration
const SMSMISR_API_URL = 'https://smsmisr.com/api/OTP/';
const SMSMISR_API_USERNAME = 'd6a935c84a6701b7765d0c7aba921fbaa258a328003554b00fe56cad81b2b622';
const SMSMISR_API_PASSWORD = '56b0c503aa1fb0023332af092a70fa5cfa05b121fa6d686e2016c8ec96b91233'; 
const SMSMISR_API_SENDER = 'b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27';
const SMSMISR_API_TEMPLATE = '0f9217c9d760c1c0ed47b8afb5425708da7d98729016a8accfc14f9cc8d1ba83'; 

// Function to send OTP
const sendOtp = async (phoneNumber, otp) => {
    const url = SMSMISR_API_URL;
    const params = {
        environment: 2, // Test environment
        username: SMSMISR_API_USERNAME,
        password: SMSMISR_API_PASSWORD,
        sender: SMSMISR_API_SENDER,
        mobile: phoneNumber,
        template: SMSMISR_API_TEMPLATE,
        otp: otp
    };

    try {
        const response = await axios.get(url, { params });
        return response.data;
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw new Error('Failed to send OTP');
    }
};

// Sign-up function
const signUp = async (req, res) => {
    const { username, email, phoneNumber, password, profile_image, userFCMToken } = req.body;

    if (!username || !email || !phoneNumber || !password) {
        console.log(req.body);
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const existNumber = await User.findOne({ phoneNumber });
        if (existNumber) {
            return res.status(400).json({ message: 'Phone number already exists' });
        }
        if(req.file){
            var profile_image_url = req.file.path;
        }

        const newUser = new User({
            username,
            profile_image: profile_image_url, // Save the Cloudinary URL
            email,
            phoneNumber,
            userFCMToken,
            block: true,
            alerts: 0,
            wallet: 0,
            rate: 0,
            totalRatings: 0,
            password: bcrypt.hashSync(req.body.password, 10)
        });
        await newUser.save();

        // Generate OTP (for example, using a random number generator)
        //const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP

        // Send OTP using SMSMISR API
        // const otpResponse = await axios.post(SMSMISR_API_URL, {
        //     environment: 2, // Test environment
        //     username: SMSMISR_API_USERNAME,
        //     password: SMSMISR_API_PASSWORD,
        //     sender: SMSMISR_API_SENDER,
        //     mobile: phoneNumber,
        //     template: SMSMISR_API_TEMPLATE,
        //     otp: otp
        // });

        // Check response from SMSMISR API
        // if (otpResponse.data.code !== '4901') {
        //     return res.status(500).json({ message: 'Failed to send OTP', details: otpResponse.data });
        // }

        const userData = {
            id: newUser._id,
            profile_image: profile_image,
            username: newUser.username,
            email: newUser.email,
            block: newUser.block,
            alerts: newUser.alerts,
            userFCMToken,
            phoneNumber: newUser.phoneNumber,
            rate: 0,
            totalRatings: 0,
        };
        res.status(201).json({ message: 'User created successfully', user: userData });
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: error.message });
    }
};

const patchBlock = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const newBlockValue = !user.block;
        const updatedUser = await User.findOneAndUpdate(
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
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({ message: "User not found" });
        }

        // Increment the alerts count
        const updatedUser = await User.findOneAndUpdate(
            { _id: userId },
            { $inc: { alerts: 1 } },  
            { new: true }
        );

        res.status(200).json(updatedUser); 
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
}

const DeleteUser = async function(req, res) {
    const userId = req.params.id;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }
        res.status(200).json({ message: "User Deleted Successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}


const verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        return res.status(400).json({ message: 'Phone number and OTP are required' });
    }

    try {
        const user = await User.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        // OTP is valid; complete the signup process
        user.isVerified = true; // Mark user as verified
        user.otp = null; // Clear OTP
        await user.save();

        res.status(200).json({ message: 'Phone number verified successfully' });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Login function
const login = async (req, res) => {
    const { email, password, phoneNumber } = req.body;

    if ((!email && !phoneNumber) || !password) {
        return res.status(400).json({ message: 'Email or phone number and password are required' });
    }
    try {
        const user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // if(user.block === true){
            const valid = bcrypt.compareSync(password, user.password);
            if (!valid) {
                return res.status(401).json({ message: 'Incorrect password' });
            }

            //const token = jwt.sign({ id: user._id, username: user.username }, "5739dc5e96c68d2200d196390a0dc53e73013a4ecc6fb144ff1368e570c0126d4afda02965f5d67975f2a01dc1bd9abb77a5284f230468a5ea24155aee8ae1d4", { expiresIn: '1h' });

            const userData = {
                id: user._id,
                username: user.username,
                email: user.email,
                phoneNumber: user.phoneNumber
            };

            return res.status(200).json({ message: 'Login successful', user: userData });
        //}

    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};


// Update password function
const updatePassword = async (req, res) => {
    const { email, phoneNumber, currentPassword, newPassword } = req.body;

    if ((!email && !phoneNumber) || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Email or phone number, current password, and new password are required' });
    }

    try {
        const user = await User.findOne({ $or: [{ email }, { phoneNumber }] });
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

const handleToken = async function(req, res) {
    const id = req.params.id;
    const { userFCMToken } = req.body;

    try {
        if(!userFCMToken){
            res.status(400).json({message: "userFCMToken is required"});
        }
        const found = await User.findOneAndUpdate(
            {_id: id},
            { userFCMToken: userFCMToken },
            { new: true }
        );
        
        if (!found) {
            return res.status(404).json({ message: "Driver not found" });
        }
        res.status(200).json({ message: "Token sent successfully", userFCMToken });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    signUp,
    verifyOtp,
    login,
    updatePassword,
    patchBlock,
    patchAlerts,
    DeleteUser,
    handleToken
};
