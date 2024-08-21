const bookModel = require('../../model/booking/userBooking'); // Adjust path to your model

let io;

const allTipsHandler = (socketIOInstance) => {
    io = socketIOInstance; 
};

const getAllTrips = async function(req, res){
    try {
        const allTrips = await bookModel.find();
        if (io) {
            io.emit('getTrips', allTrips);
        } else {
            console.log('io is not initialized');
        }
        res.json(allTrips);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllTrips,
    allTipsHandler, 
};
