const usersModel = require('../../model/regestration/userModel');
const driversModel = require('../../model/regestration/driverModel');
const driverDest = require('../../model/booking/driversDestination');
const tripsModel = require('../../model/booking/userBooking')
// get all users
const getAllUsers = async function(req,res){
    try{
        const users = await usersModel.find();
        res.json(users);
    }
    catch(error){
        console,log(error);
        res.status(500).json({message: error.message});
    }
}
// get all drivers
const getAllDrivers = async function(req,res){
    try{
        const drivers = await driversModel.find();
        res.status(200).json(drivers);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}
// delete user by _id in mongodb, get id by params
const deleteUser = async function(req, res){
    const userId = req.params.id;
    try {
        const deletedUser = await usersModel.findOneAndDelete({_id: userId});
        if (!deletedUser) {
            return res.status(404).json({message: "User not found"});
        }
        res.status(200).json({message: "User Deleted Successfully"});
    } catch(error) {
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}
// delete driver by _id in mongodb, get id by params
const deleteDriver = async function(req, res){
    const userId = req.params.id;
    try {
        const deletedDriver = await driversModel.findOneAndDelete({_id: userId});
        if (!deletedDriver) {
            return res.status(404).json({message: "Driver not found"});
        }
        res.status(200).json({message: "User Deleted Successfully"});
    } catch(error) {
        console.log(error);
        res.status(500).json({message: error.message}); // internal server error
    }
}

const getDriverlocation = async function(req, res){
    const driverId = req.params.id;
    try{
        const result = await driverDest.findOne({_id: driverId});
        if(!result){
            res.status(400).json({message: 'Driver not found'});
        }
        res.status(200).json(result);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}

// const alert = async function(req, res){
//     const driverId = req.params.id;
//     try{
//         const alert = await driversModel.findOne({_id: driverId});
//         if(!alert){
//             res.status(404).json({message: 'Driver not found'});
//         }

//     }
//     catch(error){
//         console.log(error);
//         res.status(500).json({message: error.message});
//     }
// }

const trips = async function(req, res) {
    try {
        const result = await tripsModel.find();  // Add `await` here
        if (result.length === 0) {  // Check if the result is an empty array
            return res.status(404).json({ message: "No Data" });
        }
        res.status(200).json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}


// export functions 
module.exports = {
    getAllUsers,
    getAllDrivers,
    deleteUser,
    deleteDriver,
    getDriverlocation,
    trips
}