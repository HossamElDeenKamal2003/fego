const Message = require('../../../model/booking/chating/newChatModel');

const chatHandler = (io) => {
    const onlineUsers = {}; // { userId: socketId }
    let onlineCount = 0;

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        // Handle user joining a room
        socket.on('user-joined', (obj) => {
            socket.username = obj.username;
            socket.userId = obj.userid;
            onlineUsers[obj.userid] = socket.id; // Map userId to socketId
            socket.join(obj.username); // Optionally join room
            console.log('User joined room:', socket.username);
        });

        // Handle user login
        socket.on('login', (obj) => {
            socket.name = obj.userid;

            if (!onlineUsers.hasOwnProperty(obj.userid)) {
                onlineUsers[obj.userid] = socket.id;
                onlineCount++;
            }

            io.emit('login', {
                onlineUsers,
                onlineCount,
                user: obj,
            });
        });

        // Handle user disconnect
        socket.on('disconnect', () => {
            if (onlineUsers.hasOwnProperty(socket.name)) {
                const obj = { userid: socket.name, username: onlineUsers[socket.name] };

                delete onlineUsers[socket.name];
                onlineCount--;

                io.emit('logout', {
                    onlineUsers,
                    onlineCount,
                    user: obj,
                });
            }
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
                });
                await message.save();

                // Send message to the intended recipient
                emitToUser(obj.to, 'chat', {
                    msg: obj.msg,
                    from: obj.from,
                    media: obj.media,
                    mediaType: obj.mediaType,
                });

                // Optionally, notify the sender that the message was sent successfully
                socket.emit('message-sent', message);

            } catch (err) {
                console.error('Error saving message:', err);
                socket.emit('error', { message: 'Message could not be sent' });
            }
        });
    });

    // Function to emit message to a specific user
    function emitToUser(userId, event, message) {
        const socketId = onlineUsers[userId];
        if (socketId) {
            io.sockets.sockets.get(socketId)?.emit(event, message);
        } else {
            console.log(`Recipient with ID ${userId} is not online.`);
        }
    }
};

module.exports = chatHandler;
