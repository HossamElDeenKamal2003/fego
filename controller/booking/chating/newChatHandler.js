const Message = require('../../../model/booking/chating/newChatModel'); 
// const sendNotification = require('../../firebase.js');

const chatHandler = (io) => {
    const onlineUsers = {};
    let onlineCount = 0;

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user joining a room
        socket.on('user-joined', (obj) => {
            socket.username = obj.username;
            socket.join(obj._id); // Join the room using the user ID
            console.log('User joined room:', socket.username);
        });

        // Handle chat messages
        socket.on('chat', async (obj) => {
            try {
                // Create a new message in the database
                const message = new Message({
                    from: obj.from,
                    to: obj.to,
                    msg: obj.msg,
                    media: obj.media,
                    mediaType: obj.mediaType,
                    status: "sent", // Ensure status is set
                    timestamp: new Date()
                });
                await message.save();

                // Send message to the intended recipient's room
                socket.to(obj.to).emit('chat', { 
                    msg: obj.msg, 
                    from: obj.from,
                    media: obj.media,
                    mediaType: obj.mediaType,
                    status: "sent"
                });

                // Optionally, notify the sender that the message was sent
                socket.emit('message-sent', message);
                
            } catch (err) {
                console.error('Error saving message:', err);
                socket.emit('error', { message: 'Message could not be sent' });
            }
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
};

module.exports = chatHandler;
