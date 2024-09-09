const mongoose = require('mongoose');
const destDriver = require('../../model/booking/driversDestination');
const { Server } = require('socket.io');

const locationHandler = (io) => {
    io.on('connection', (socket) => {
        console.log("Driver Connected to update location");

        socket.on('updateLocation', async (data) => {
            console.log('before : ', data);
            try {
                const { driverId, longitude, latitude } = data;
                console.log('after : ', data);
                if (!driverId || typeof longitude !== 'number' || typeof latitude !== 'number') {
                    socket.emit('error', { message: 'Driver ID, longitude, and latitude are required and must be numbers' });
                    return;
                }

                if (!mongoose.isValidObjectId(driverId)) {
                    socket.emit('error', { message: 'Invalid Driver ID' });
                    return;
                }

                const result = await destDriver.findOneAndUpdate(
                    { driverId: driverId },
                    { location: { type: "Point", coordinates: [longitude, latitude] } },
                    { new: true }
                );

                if (!result) {
                    return;
                }   
                console.log(driverId);

                io.emit(`location-updated/${driverId}`, {
                    driverId,
                    location: result.location,
                });
                console.log(`Emitted location update for driver ${driverId}:`, result.location);
            } catch (error) {
                console.error('Error updating location:', error);
                socket.emit('error', { message: 'Error updating location' });
            }
        });
    });
};

module.exports = locationHandler;
