// const userModel = require('../model/users/users');
// const bcrypt = require('bcrypt');

// // Sign Up Function
// const signUp = async (req, res) => {
//     const { profile_image, userName, gender, date_of_birth, phoneNumber } = req.body;

//     try {
//         // Check if user already exists
//         const existingUser = await userModel.findOne({ phoneNumber });
//         if (existingUser) {
//             return res.status(400).json({ message: 'User already exists' });
//         }

//         // Hash the password
//         const hashedPassword = await bcrypt.hash(password, 10);
//         if(req.file){
//             var profile_image_url = req.file.path;
//         }
//         // Create a new user
//         const user = new userModel({
//             profile_image: profile_image_url || null,
//             userName,
//             gender,
//             date_of_birth,
//             phoneNumber,
//         });

//         await user.save();
//         res.status(200).json({ message: 'User registered successfully' });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// const patchProfileImage = async (req, res) => {
//     const { userId } = req.params;

//     try {
//         // Check if user exists
//         const user = await userModel.findById(userId);
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if a new file is provided
//         if (req.file) {
//             user.profile_image = req.file.path;
//         }

//         // Save the updated user
//         await user.save();
//         res.status(200).json({ message: 'Profile image updated successfully', profile_image: user.profile_image });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: error.message });
//     }
// };
// // Sign In Function
// const signIn = async (req, res) => {
//     try {
//         const { phoneNumber, password } = req.body;

//         // Find user by phone number
//         const user = await userModel.findOne({ phoneNumber });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Compare the passwords
//         const isMatch = await bcrypt.compare(password, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Invalid credentials' });
//         }

//         res.status(200).json({ message: 'Sign-in successful', user });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Change Password Function
// const changePassword = async (req, res) => {
//     try {
//         const { phoneNumber, currentPassword, newPassword } = req.body;

//         // Find the user by phone number
//         const user = await userModel.findOne({ phoneNumber });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Check if current password is correct
//         const isMatch = await bcrypt.compare(currentPassword, user.password);
//         if (!isMatch) {
//             return res.status(400).json({ message: 'Current password is incorrect' });
//         }

//         // Hash the new password and update it
//         user.password = await bcrypt.hash(newPassword, 10);
//         await user.save();

//         res.status(200).json({ message: 'Password changed successfully' });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Forget Password Function (without token)
// const forgetPassword = async (req, res) => {
//     try {
//         const { newPassword } = req.body;

//         // Find the user by phone number
//         const user = await userModel.findOne({ phoneNumber });
//         if (!user) {
//             return res.status(404).json({ message: 'User not found' });
//         }

//         // Hash the new password and update it
//         user.password = await bcrypt.hash(newPassword, 10);
//         await user.save();

//         res.status(200).json({ message: 'Password has been reset successfully' });
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: error.message });
//     }
// };

// // Exporting all functions
// module.exports = {
//     signUp,
//     signIn,
//     changePassword,
//     forgetPassword,
//     patchProfileImage
// };
