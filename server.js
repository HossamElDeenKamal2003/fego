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
const io = new Server(server);
app.use(cors());
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(morgan("combined"));
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
app.get('/home', (req, res)=>{
    
});
// const PayTabs = require('paytabs_pt2');

// const profileID = process.env.PAYTABS_PROFILE_ID;
// const serverKey = process.env.PAYTABS_SERVER_KEY;
// const region = "EGY";

// PayTabs.setConfig(profileID, serverKey, region);

// // Payment Endpoint
// app.post('/create-payment', (req, res) => {
//     // Payment Details
//     let paymentMethods = ["all"];
//     let transaction = {
//         type: "sale",
//         class: "ecom"
//     };
//     let cart = {
//         id: "4111 1111 1111 1111",
//         currency: "EGP",
//         amount: 100.00,
//         description: "Order description"
//     };

//     // Customer Details from the request body
//     let customer = req.body.customer;

//     if (!customer) {
//         return res.status(400).json({ error: "Customer details are required." });
//     }

//     // Response URLs
//     let response_URLs = [
//         "https://fliegertechnology-production-6024.up.railway.app/response",
//         "https://fliegertechnology-production-6024.up.railway.app/callback"
//     ];

//     // Language setting
//     let lang = "ar";

//     // Callback for payment page creation
//     function paymentPageCreated(results) {
//         console.log('PayTabs Response:', results); 
//         if (results && results.payment_url) {
//             res.json({ payment_url: results.payment_url });
//         } else {
//             console.log(results.error)
//             console.log('Request Headers:', {
//                 'Authorization': `Bearer ${serverKey}`,
//                 'Content-Type': 'application/json'
//             });
            
//             res.status(400).json({ error: results.error || "Failed to create payment page." });
//         }
//     }

//     // Create Payment Page
//     PayTabs.createPaymentPage(
//         paymentMethods,
//         [transaction.type, transaction.class],
//         [cart.id, cart.currency, cart.amount, cart.description],
//         [customer.name, customer.email, customer.phone, customer.street, customer.city, customer.state, customer.country, customer.zip, customer.IP],
//         [], // Shipping address (optional)
//         response_URLs,
//         lang,
//         paymentPageCreated,
//         {
//             'Authorization': `Bearer SMJ9NJNMKR-JJWL2MBMTZ-GGTWRWK2ZBCBK2M9-2P9966-VBMN2N-BQDDBH`,  // Authorization header
//             'Content-Type': 'application/json'
//         }
//     );
// });

// // Handle Payment Response
// app.get('/response', (req, res) => {
//     console.log(req.query);
//     res.send("Payment Response Received");
// });

// // Handle Callback from PayTabs
// app.post('/callback', (req, res) => {
//     console.log(req.body);
//     res.send("Callback Received");
// });

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

    return R * c; // in meters
}
