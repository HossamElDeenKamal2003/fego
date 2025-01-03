const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const socketHandler = require('./controller/booking/offerWebsocket');
const offerController = require('./controller/booking/offers')
const tripSocketHandler = require('./controller/booking/allTripswebSocket');
const chatHandler = require('./controller/booking/chating/newChatHandler');
const { driverDataHandler } = require('./controller/booking/statusTripSockets/acceotTripSockets');

dotenv.config();
console.log(process.env.NODE_ENV);
const app = express();
const server = http.createServer(app);
// const io = new Server(server);
const io = new Server(server, {
  cors: {
      origin: "*", // TODO: Replace "*" with your client origin(s) for better security
      methods: ["GET", "POST"],
  },
});
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));

//connected to MONGODB
mongoose.connect(process.env.DB_URL)
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
        process.exit(1); // Exit process with failure code
    });

// Ensure the directory exists before setting up multer storage
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for local file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    },
});

const upload = multer({ storage: storage });

// Import routes
const user = require("./router/userRouter/userRouter");
const driver = require("./router/userRouter/driverRouter");
const book = require("./router/bookTrip/bookingRouting");
const userProfile = require("./router/userProfile/patchUser");
const driverProfile = require("./router/userProfile/patchDriver");
const prices = require("./router/bookTrip/priceRouter");
const createChat = require("./router/chatingRouter/createChat");
const admin = require('./router/admin/adminRouters');
// Middleware for static files
app.use("/uploads", express.static(uploadDir));
app.use("/auth", user);
app.use("/authdriver", driver);
app.use("/book", book);
app.use("/user-profile", userProfile);
app.use("/driverprofile", driverProfile);
app.use("/prices", prices);
app.use("/create", createChat);
app.use("/admin", admin);


// Track user searches
const userSearches = new Map(); // Map<socketId, searchCriteria>

const locationHandler = require('./controller/booking/driverDest'); // Adjust the path as necessary
const costHandler = require('./controller/booking/costUpdate');
const handleSocketConnection = require('./controller/booking/tripsPending');
offerController.setSocketInstance(io);

// Initialize WebSocket handler
// socketHandler(io);
socketHandler(io);
tripSocketHandler(io);
costHandler(io);
//driverSocketHandler(io); // Driver-specific WebSocket handler
chatHandler(io);
//tripStatusHandler(io);
driverDataHandler(io);
locationHandler(io) // Attaches the socket instance to the HTTP server
handleSocketConnection(io);
//updateLocation(io);

global.io = io;
//const io = new Server(server);
const connectedUsers = {}; // Change from Map to an object

io.on('connection', (socket) => {
    console.log('New connection');
    // When a user disconnects
    socket.on('disconnect', () => {
        // Remove userId from connectedUsers if necessary
        console.log('disconnected')
    });
});

module.exports = { connectedUsers, io };
app.get("/", (req, res) => {
    res.send("Express");
});

app.get('/payment-result', (req, res) => {
    res.send("Payment Successful! Transaction ID: " + transaction_id);
});


app.get('/payment-callback', (req, res)=>{
    res.status('payment callback')
})

app.get('/home', (req, res)=>{
    
});

app.get('/privacy-policy', (req, res) => {
    res.render(path.join(__dirname, 'views', 'index.ejs'));
  });
const axios = require('axios');
app.post('/pay', async (req, res) => {
    const { amount, currency, customerDetails } = req.body;

    const data = {
        profile_id: process.env.PAYTABS_PROFILE_ID,  // Set PayTabs Profile ID in .env
        tran_type: 'sale',
        tran_class: 'ecom',
        cart_id: `cart_${Date.now()}`,
        cart_description: "Product Purchase",
        cart_currency: currency,
        cart_amount: amount,
        customer_details: customerDetails,
        return: 'https://backend.fego-rides.com/payment-result', 
        callback: 'https://backend.fego-rides.com/payment-callback'
    };

    try {
        const response = await axios.post('https://secure-egypt.paytabs.com/payment/request', data, {
            headers: {
                'Authorization': "SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZB"
            }
        });
        console.log(response.data);
        res.json(response.data);
    } catch (error) {
        console.error("Payment initiation error:", error);
        res.status(500).send("Payment initiation failed.");
    }
});


// Payment result route to handle the return from PayTabs
app.post('/payment-result', async (req, res) => {
  console.log('Payment result data:', req.body);

  try {
      const { tran_status, cart_amount, customer_details } = req.body; // Adjust keys if needed

      if (tran_status === 'A') { // 'A' indicates approved payment
          console.log('✅ Payment approved');

          // Extract driver ID from customer details
          const driverId = customer_details?.driverId; // Ensure driverId is sent in customer_details
          if (!driverId) {
              return res.status(400).json({ message: 'Driver ID is missing in customer details' });
          }

          // Fetch the driver from the database
          const driver = await Driver.findOne({ _id: driverId });
          if (!driver) {
              return res.status(404).json({ message: 'Driver not found' });
          }

          // Update driver's wallet and updateWallettime
          driver.wallet = (driver.wallet || 0) + parseFloat(cart_amount); // Ensure amount is added correctly
          driver.updateWallettime = new Date();

          await driver.save();

          console.log('✅ Driver wallet updated successfully:', { wallet: driver.wallet, updateWallettime: driver.updateWallettime });

          return res.status(200).json({ 
              message: 'Payment succeeded and wallet updated', 
              wallet: driver.wallet, 
              updateWallettime: driver.updateWallettime 
          });
      } 
      
      else if (tran_status === 'D') {
          console.warn('⚠️ Payment declined');
          return res.status(400).json({ message: 'Payment declined. Please try again.' });
      } 
      
      else if (tran_status === 'V') {
          console.warn('⚠️ Payment voided');
          return res.status(400).json({ message: 'Payment voided.' });
      } 
      
      else {
          console.warn('⚠️ Unknown payment status');
          return res.status(400).json({ message: 'Payment failed or unknown status' });
      }
  } catch (error) {
      console.error('❌ Error verifying payment result:', error);
      return res.status(500).json({ message: 'An error occurred while processing payment result', error: error.message });
  }
});

const ChatModel = require('./model/chatSupport');
const User = require('./model/regestration/userModel');
const Driver = require('./model/regestration/driverModel');
const AuthAdmin = require('./model/regestration/authAdmin');
const support = require('./model/regestration/support');
const sendNotification = require('./firebase');
const notifications = require('./model/notification');
// Middleware to get all chats (active or ended) with messages and user data
const getAllChatsWithMessagesAndUserData = async (req, res, next) => {
  try {
    // Retrieve all chats (both active and ended)
    const chats = await ChatModel.find().lean();

    // Attach user data and messages to each chat
    const chatWithUserData = await Promise.all(
      chats.map(async (chat) => {
        const user = await User.findById(chat.userId).lean();
        return {
          ...chat,
          user,
        };
      })
    );

    // Attach the resulting data to the request object
    req.allChatsWithUserData = chatWithUserData;

    // Continue to the next middleware or route
    next();
  } catch (error) {
    console.error('Error fetching all chats with user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
app.get('/getAllChats', getAllChatsWithMessagesAndUserData, (req, res) => {
  // Send the data attached by the middleware
  res.status(200).json({ chats: req.allChatsWithUserData });
});
const getChatsWithUserData = async (req, res, next) => {
  try {
    // Retrieve the first active chat (not an array, but a single chat)
    const chat = await ChatModel.findOne({ status: 'active' }).lean();

    if (!chat) {
      return res.status(404).json({ message: 'No active chats found.' });
    }
    const activeChatsCount = await ChatModel.countDocuments({ status: 'active' });

    // Fetch the user data for the single chat
    const user = await User.findById(chat.userId).lean();

    // Attach the chat and user data to the request object
    req.chatWithUserData = { ...chat, user };
    req.activeChatsCount = activeChatsCount;
    // Continue to the next middleware or route
    next();
  } catch (error) {
    console.error('Error fetching the chat with user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

app.get('/getChats', getChatsWithUserData, (req, res) => {
  // Send the data attached by the middleware
  res.status(200).json({ chats: req.chatWithUserData, activeChatsCount: req.activeChatsCount });
});

const data = require('./middlewares/fiels');
const supportModel = require("./model/regestration/support");
app.post('/sendMessage', data.array('media', 5), async (req, res) => {
  try {
    const { chatId, userId, sender, message } = req.body;
    const mediaFiles = req.files; // Uploaded files from the request

    // Find the chat session by ID
    const chat = await ChatModel.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat session not found.' });
    }

    if (chat.status !== 'active') {
      return res.status(400).json({ message: 'Chat session is not active.' });
    }

    // Add the new message with optional media
    const newMessage = {
      userId,
      sender,
      message: message || '', // If message is not provided, use an empty string
      timestamp: new Date(),
      media: mediaFiles && mediaFiles.length > 0 ? mediaFiles.map((file) => ({
        url: file.path, // Cloudinary URL
        type: file.mimetype.split('/')[0], // e.g., 'image', 'video'
      })) : [], // If no media, return an empty array
    };

    chat.messages.push(newMessage);
    // Save the updated chat
    await chat.save();
    let token = null;
    let user = null;
    const notificationMessage = { title: 'New Message', body: message, route: "/supportScreen" };
  if(sender === 'user'){
    user = await User.findOne({_id: userId});
    console.log("ussserrrrrrr", user);
    if(user){
      token = user.userFCMToken;
    }
    if(token){
      sendNotification(token, notificationMessage);
    }
    if(!user){
      user = await Driver.findOne({_id: userId});
      console.log("ussserrrrrrr", user);
      if(user){
        console.log(user);
        token = user.driverFCMToken;
      }
      
      if(token){
        sendNotification(token, notificationMessage);
      }
    }
  }
  else{
    user = await AuthAdmin.findById(userId) 
    ? await AuthAdmin.findById(userId) 
    : await support.findById(userId);
    token = user.adminFCMToken;
    console.log("admin", user);
    if(token){
      sendNotification(token, notificationMessage);
    }
  }
    if (global.io) {
      io.emit(`newMessage/${chatId}`, { message: newMessage, user: user });
    }
    const newNotication = new notifications({
      title: "New Message",
      body: "New message from active chat",
      sender: sender,
    })
    await newNotication.save();
    res.status(200).json({ message: newMessage, user: user, notifications: newNotication });
  } catch (error) {
    console.error('Error handling message upload:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});
app.post('/startChat', async (req, res) => {
  const { userId } = req.body;

  // Check if the user already has an active chat
  const activeChat = await ChatModel.findOne({ userId, status: 'active' });
  if (activeChat) {
    return res.status(200).json({ chatId: activeChat._id});
  }
  // Count the number of currently active chats
  const activeChatsCount = await ChatModel.countDocuments({ status: 'active' });
  const supportDocs = await support.find().lean(); // Get all support documents
  const adminDocs = await AuthAdmin.find().lean(); // Get all admin documents

    const notificationMessage = {
      title: 'New Chat Started',
      body: 'A new user is waiting in the queue.',
    };
    for (const supportUser of supportDocs) {
      if (supportUser.adminFCMToken) {
        sendNotification(supportUser.adminFCMToken, notificationMessage);
      }
    }

    // Notify all admin users
    for (const adminUser of adminDocs) {
      if (adminUser.adminFCMToken) {
        sendNotification(adminUser.adminFCMToken, notificationMessage);
      }
    }

    // Save a new notification in the database
    const newNotification = new notifications({
      title: "New Chat Started",
      body: 'A new user is waiting for support.',
      sender: userId,
      route: "/supportScreen"
    });
    await newNotification.save();
  // Create a new chat session
  const newChat = await ChatModel.create({
    userId,
    status: 'active',
    messages: [],
    createdAt: new Date(),
  });
  // Respond with the chat ID and the number of waiting chats
  res.status(200).json({
    chatId: newChat._id,
    waitingChats: activeChatsCount,
    notifications: newNotification
  });
});

app.post('/endChat', async (req, res) => {
  const { chatId } = req.body;

  const chat = await ChatModel.findByIdAndUpdate(chatId, {
    status: 'ended',
    endedAt: new Date()
  });

  if (!chat) {
    return res.status(404).json({ message: 'Chat session not found.' });
  }

  res.status(200).json({ message: 'Chat session ended successfully.' });
});

app.get('/get-notifications', async(req, res)=>{
  try{
    const notification = await notifications.find();
    res.status(200).json({notifications: notification});
  }
  catch(error){
    console.log(error);
    return res.status(500).json({message: error.message});
  }
});

app.get('/chat/:id', async (req, res) => {
  try {
    // Extract the id from the request parameters
    const { id } = req.params;

    // Find the chat by _id
    const chat = await ChatModel.findOne({ _id: id });

    // Check if the chat exists
    if (!chat) {
      return res.status(400).json({ message: "No Chats Match This _id" });
    }

    // Send the chat data in the response
    res.status(200).json({ chat: chat });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
});

const updateFCMToken = async (model, adminId, fcmToken, res) => {
  try {
    // Validate FCM token
    if (!fcmToken) {
      return res.status(400).json({ message: "FCM token is required" });
    }

    // Find admin/support by ID
    const admin = await model.findOne({ _id: adminId });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    // Update FCM token and save
    admin.adminFCMToken = fcmToken;
    await admin.save();

    return res.status(200).json({ message: "FCM token updated successfully" });
  } catch (error) {
    console.error("Error updating FCM token:", error);
    return res.status(500).json({ message: "An error occurred while updating the FCM token" });
  }
};

// Routes
app.post('/updateAdmintoken/:id', async (req, res) => {
  const adminId = req.params.id;
  const { fcmToken } = req.body;

  await updateFCMToken(AuthAdmin, adminId, fcmToken, res);
});

app.post('/updateSupporttoken/:id', async (req, res) => {
  const adminId = req.params.id;
  const { fcmToken } = req.body;

  await updateFCMToken(supportModel, adminId, fcmToken, res);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

// Handle graceful shutdown 
process.on("SIGTERM", () => {
    server.close(() => {
        console.log("Process terminated");
    });
});
module.exports = app;
// Utility function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}