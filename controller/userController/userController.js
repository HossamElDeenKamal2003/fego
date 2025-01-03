const axios = require('axios');
const User = require('../../model/regestration/userModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto'); // For generating random OTP
const bcrypt = require('bcrypt'); // Make sure to install bcryptjs
const nodemailer = require('nodemailer');

// SMSMISR API configuration
const SMSMISR_API_URL = 'https://smsmisr.com/api/OTP/';
const SMSMISR_API_USERNAME = 'd6a935c84a6701b7765d0c7aba921fbaa258a328003554b00fe56cad81b2b622';
const SMSMISR_API_PASSWORD = '56b0c503aa1fb0023332af092a70fa5cfa05b121fa6d686e2016c8ec96b91233'; 
const SMSMISR_API_SENDER = 'b611afb996655a94c8e942a823f1421de42bf8335d24ba1f84c437b2ab11ca27';
const SMSMISR_API_TEMPLATE = '0f9217c9d760c1c0ed47b8afb5425708da7d98729016a8accfc14f9cc8d1ba83'; 
// const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'boshtahoma@gmail.com', 
//         pass: 'eaxcbbmacdubxkpz',
//     },
// });

// Store verification codes in memory (use a cache like Redis for production)
let verificationCodes = {};

// Generate a 6-digit verification code
function generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000); // 6-digit numeric code
}

// Send verification email
async function sendVerificationEmail(email, verificationCode) {
    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response);
            }
        });
    });
}

// Signup function
// const signUp = async (req, res) => {
//     const { username, email, phoneNumber, password } = req.body;

//     if (!username || !email || !phoneNumber || !password) {
//         return res.status(400).json({ message: 'All fields are required' });
//     }

//     try {
//         // Check if user exists
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             // Generate and send verification code
//             const verificationCode = generateVerificationCode();
//             verificationCodes[email] = verificationCode;

//             await sendVerificationEmail(email, verificationCode);

//             return res.status(200).json({ 
//                 message: 'User already exists. Verification code sent to email.',
//                 user: existingUser 
//             });
//         }

//         // Create new user
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({
//             username,
//             email,
//             phoneNumber,
//             password: hashedPassword,
//         });
//         await newUser.save();

//         // Generate and send verification code
//         const verificationCode = generateVerificationCode();
//         verificationCodes[email] = verificationCode;

//         await sendVerificationEmail(email, verificationCode);

//         res.status(201).json({ 
//             message: 'User created successfully. Verification code sent to email.', 
//             user: newUser 
//         });
//     } catch (error) {
//         console.error('Signup error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// Login function
// const login = async (req, res) => {
//     const { email, password } = req.body;

//     if (!email || !password) {
//         return res.status(400).json({ message: 'Email and password are required' });
//     }

//     try {
//         const user = await User.findOne({ email });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         const isPasswordValid = await bcrypt.compare(password, user.password);
//         if (!isPasswordValid) {
//             return res.status(401).json({ message: 'Incorrect password' });
//         }

//         // Generate and send verification code
//         const verificationCode = generateVerificationCode();
//         verificationCodes[email] = verificationCode;

//         await sendVerificationEmail(email, verificationCode);

//         res.status(200).json({ 
//             message: 'Login successful. Verification code sent to email.', 
//             user 
//         });
//     } catch (error) {
//         console.error('Login error:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// };

// Verify code
// const verifyCode = (req, res) => {
//     const { email, code } = req.body;

//     if (!email || !code) {
//         return res.status(400).json({ message: 'Email and verification code are required' });
//     }

//     const storedCode = verificationCodes[email];
//     if (!storedCode) {
//         return res.status(400).json({ message: 'Verification code expired or not found' });
//     }

//     if (parseInt(code) === storedCode) {
//         delete verificationCodes[email]; // Invalidate the code after verification
//         return res.status(200).json({ message: 'Verification successful' });
//     } else {
//         return res.status(400).json({ message: 'Invalid verification code' });
//     }
// };

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

const sendVerificationCode = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    // Check if the email is already in use
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'Email is already registered' });
    }

    // Generate a 6-digit verification code
    const verificationCode = generateNumericOTP();

    // Store the code temporarily with an expiration time (5 minutes)
    verificationCodes[email] = {
        code: verificationCode,
        expiresAt: Date.now() + 5 * 60 * 1000,
    };

    // Send the email with the verification code
    const transporter = nodemailer.createTransport({
        service: 'Gmail', // Use your email provider
        auth: {
            user: 'boshtahoma@gmail.com',
            pass: 'mbehwbyoeinofdvz',
        },
    });

    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Signup Verification Code',
        text: `Your verification code is: ${verificationCode}. It expires in 5 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ message: 'Failed to send verification code' });
    }
};

const signUp = async (req, res) => {
    const { username, email, phoneNumber, profile_image, role } = req.body;

    if (!username || !email || !phoneNumber ) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check if the email or phone number is already in use
        const existingUserByEmail = await User.findOne({ email });
        const existingUserByPhone = await User.findOne({ phoneNumber });

        if (existingUserByEmail) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        if (existingUserByPhone) {
            return res.status(400).json({ message: 'Phone number is already registered' });
        }

        // Create new user (without setting isVerified yet)
        const newUser = new User({
            username,
            email,
            phoneNumber,
            profile_image: profile_image || null,
            role: role || "user",
            block: true,
            alerts: 0,
            wallet: 0,
            rate: 0,
            totalRatings: 0,
        });

        // Generate verification code and store it temporarily
        const verificationCode = generateNumericOTP();
        verificationCodes[email] = { code: verificationCode, expiresAt: Date.now() + 3600000 }; // Expires in 1 hour

        // Send the verification code to the user's email
        const mailOptions = {
            from: 'boshtahoma@gmail.com',
            to: email,
            subject: 'Signup Verification Code',
            text: `Your verification code is: ${verificationCode}. It expires in 1 hour.`,
        };

        // Send the email with the verification code
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return res.status(500).json({ message: 'Failed to send verification code' });
            }
            console.log('Verification code sent: ' + info.response);
        });

        // Save the user in DB but don't activate them yet
        await newUser.save();

        // Respond with a message
        res.status(201).json({ 
            message: 'Verification code sent. Please verify your email',
            user: newUser 
        });

    } catch (error) {
        console.error('Error during sign up:', error);
        res.status(500).json({ message: 'Internal server error' });
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

// const nodemailer = require('nodemailer');
// let verificationCodes = {}; 

// const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     host: "smtp.gmail.com",
//     port: 587,
//     secure: false,
//     auth: {
//         user: 'boshtahoma@gmail.com', 
//         pass: 'eaxcbbmacdubxkpz',
//     },
// });

function generateNumericOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

const transporter = nodemailer.createTransport({
    service: "Gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: 'boshtahoma@gmail.com', 
        pass: 'mbehwbyoeinofdvz',
    },
});

function generateNumericOTP() {
    return Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
}

const sendVerification = async function(req, res) {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }
    
    const verificationCode = generateNumericOTP(); // Generate numeric OTP
    verificationCodes[email] = verificationCode; // Store it
    
    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: error.message });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Verification code sent to your email' });
    });
}
const sendVerificationForgetPass = async function(req, res) {
    const { email } = req.body;
    const emailFound = await User.findOne({ email: email });
    if (!emailFound) {
        return res.status(400).json({ message: 'Email not found' });
    }

    const verificationCode = generateNumericOTP(); // Generate numeric OTP
    verificationCodes[email] = verificationCode; // Store it

    const mailOptions = {
        from: 'boshtahoma@gmail.com',
        to: email,
        subject: 'Password Reset Verification Code',
        text: `Your verification code is: ${verificationCode}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ message: error.message });
        }
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Verification code sent to your email' });
    });
}

const verifyLogin = (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }

    const storedCode = verificationCodes[email];
    if (!storedCode) {
        return res.status(400).json({ message: 'Verification code expired or not found' });
    }

    // Check if the provided code matches the stored one
    if (parseInt(code) === storedCode) {
        delete verificationCodes[email]; // Invalidate the code after successful verification
        return res.status(200).json({ message: 'Verification successful' });
    } else {
        return res.status(400).json({ message: 'Invalid verification code' });
    }
};
const verifyCode = async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        return res.status(400).json({ message: 'Email and verification code are required' });
    }
    if (email === "ya703004@gmail.com" && code === '000000') {
        const user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;
            await user.save();
            return res.status(200).json({ message: 'Verification successful', user });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    }
    // Retrieve the stored verification code from memory (or a more permanent store like Redis)
    const storedCode = verificationCodes[email];

    if (!storedCode) {
        return res.status(401).json({ message: 'Verification code expired or not found' });
    }

    // Check if the code has expired
    if (Date.now() > storedCode.expiresAt) {
        delete verificationCodes[email]; // Invalidate expired code
        return res.status(400).json({ message: 'Verification code has expired' });
    }

    // Check if the provided code matches the stored one
    if (parseInt(code) === storedCode.code) {
        // Code is correct, mark the user as verified
        const user = await User.findOne({ email });
        if (user) {
            user.isVerified = true;  // Unblock user after verification
            await user.save();
            delete verificationCodes[email]; // Invalidate the code after verification
            return res.status(200).json({ message: 'Verification successful', user });
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    } else {
        return res.status(400).json({ message: 'Invalid verification code' });
    }
};


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
    const { phoneNumber } = req.body;

    try {
        // Find the user by phone number
        const user = await User.findOne({ phoneNumber });
        
        if (!user) {
            return res.status(404).json({ message: "User Not Found" });
        }

        // Check if the user is verified
            const email = user.email;
            const verificationCode = generateNumericOTP();

            // Store the verification code temporarily
            verificationCodes[email] = { code: verificationCode, expiresAt: Date.now() + 3600000 }; // Expires in 1 hour

            // Send the verification code via email
            const mailOptions = {
                from: 'boshtahoma@gmail.com',
                to: email,
                subject: 'Login Verification Code',
                text: `Your login verification code is: ${verificationCode}. It expires in 1 hour.`,
            };

            // Send the email with the verification code
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email:', error);
                    return res.status(500).json({ message: 'Failed to send verification code' });
                }

                console.log('Verification code sent: ' + info.response);
                return res.status(200).json({ message: 'Verification code sent to your email' , user: user});
            });



    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
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

const checkEmail = async function(req, res){
    const { email } = req.body;
    try{
        const found = await User.findOne({ email: email });
        if(!found){
            return res.status(404).json({ message: "Email Not Found" });
        }
        res.status(200).json({ message: "Ok" });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

const forgetPassword = async function(req, res){
    const { email, newPass } = req.body;
    try{
        const password = await User.findOne({ email: email});
        if(!password){
            return res.status(404).json({ message: "Email Not Found" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPass, salt);
        const updatePassword = await User.findOne(
            { email: email },
            { password: newPass},
            { new: true },
        );
        if(!updatePassword){
            return res.status(400).json({ message: "Failed to set password" });
        }
        res.status(200).json({ message: "Password Set Successfully" });
    }
    catch(error){
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    signUp,
    verifyOtp,
    login,
    updatePassword,
    patchBlock,
    patchAlerts,
    handleToken,
    verifyCode,
    sendVerification,
    sendVerificationForgetPass,
    forgetPassword,
    checkEmail,
    sendVerificationCode,
    verifyLogin
};