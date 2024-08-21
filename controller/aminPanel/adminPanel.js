const usersModel = require('../../model/regestration/userModel');
const driversModel = require('../../model/regestration/driverModel');
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

const getAllDrivers = async function(req,res){
    try{
        const drivers = await driversModel.find();
        res.status(200).json(drivers);
    }
    catch(error){
        console.log(error);
        res.status(500).json({message: error.message});
    }
}


module.exports = {
    getAllUsers,
    getAllDrivers
}