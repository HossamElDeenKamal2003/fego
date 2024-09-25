    const usersModel = require('../../model/regestration/userModel');
    const driversModel = require('../../model/regestration/driverModel');
    const driverDest = require('../../model/booking/driversDestination');
    const tripsModel = require('../../model/booking/userBooking');
    const distance = require('../../model/booking/maxDistance');
    const properities = require('../../model/booking/tripProperity');
    const bookModel = require('../../model/booking/userBooking');
    const updateProperity = async function(req, res) {
        const { time, distance } = req.body;
        try {
            const properity = await properities.findOne(); // Get the first document
            
            if (!properity) {
                return res.status(404).json({ message: "Properities not found" });
            }
    
            properity.time = time;
            properity.distance = distance;
    
            await properity.save();
    
            res.status(200).json({ message: "Updated Properities Successfully", properity });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

    const getProperity = async function(req, res){
        try{
            const properity = await properities.findOne();
            if(!properity){
                res.status(404).json({ message: "No Properity for Trip"});
            }
            res.status(200).json(properity);
        }
        catch(error){
            console.log(error);
            res.status(500).json({ message: error.message});
        }
    }

    const addProperites = async function(req, res) {
        try {
            const newProp = new properities({
                time: 10, // You can use values from req.body if needed
                distance: 50
            });
            
            await newProp.save();
    
            // Send a success response
            res.status(201).json({ message: "Properities added successfully", newProp });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    };

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

    const alert = async function(req, res) {
        const driverId = req.params.id;
        try {
            // Increment the alert count
            const result = await driversModel.updateOne(
                { _id: driverId },
                { $inc: { alerts: 1 } }
            );
    
            // Check if the update was successful
            if (result.nModified === 0) {
                return res.status(404).json({ message: 'Driver not found or alert not incremented' });
            }
    
            // Return a success message
            res.status(200).json({ message: 'Alert incremented' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: error.message });
        }
    }
    

    const distacne = async function(req,res){
        const {maxDistance} = req.body;
        try{
            const settings = await distance.findOneAndUpdate({}, { maxDistance }, { new: true, upsert: true });
            res.status(200).json({ message: 'Distance updated successfully', settings });
        }
        catch(error){
            onsole.log(error);
            res.status(500).json('Error : ', error.message);
        }
    }

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

    const getDriver = async function(req, res){
        const driverId = req.params.id;
        try{
            const driver = await driversModel.findOne({_id: driverId});
            if(!driver){
                res.status(404).json({message: "Driver Not Found"});
            }
            res.status(200).json({driver})
        }
        catch(error){
            console.log(error);
            res.status(500).json({message: error.message});
        }
    }
    const getUser = async function(req, res){
        const userId = req.params.id;
        try{
            const user = await usersModel.findOne({_id: userId});
            if(!user){
                res.status(404).json({message: "Driver Not Found"});
            }
            res.status(200).json({user})
        }
        catch(error){
            console.log(error);
            res.status(500).json({message: error.message});
        }
    }

    const getTrips = async function(req, res) {
        try {
            // Fetch all trips
            const trips = await bookModel.find();
    
            if (!trips || trips.length === 0) {
                return res.status(404).json({ message: "No Trips Found" });
            }
    
            // Extract unique userIds from trips
            const driverIds = trips.map(trip => trip.driverId);
            const uniqueDriverIds = Array.from(new Set(driverIds));
    
            // Fetch user data for these driverIds
            const driverData = await driversModel.find({ _id: { $in: uniqueDriverIds } });
    
            // Create a map of user data for quick lookup
            const userMap = driverData.reduce((map, user) => {
                map[user._id] = user;
                return map;
            }, {});
    
            // Attach user data to each trip
            const tripsWithUserData = trips.map(trip => ({
                ...trip.toObject(),
                driverData: userMap[trip.driverId] || null
            }));
    
            // Respond with trips including user data
            res.status(200).json(tripsWithUserData);
        } catch (error) {
            console.error('Error fetching trips:', error);
            res.status(500).json({ message: "An error occurred while fetching trips.", error: error.message });
        }
    };
    
    


    // export functions 
    module.exports = {
        getAllUsers,
        getAllDrivers,
        deleteUser,
        deleteDriver,
        getDriverlocation,
        trips,
        distacne,
        alert,
        getProperity,
        updateProperity,
        addProperites,
        getDriver,
        getDriver,
        getUser,
        getTrips
    }