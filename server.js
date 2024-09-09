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
// Middleware setup
app.use(express.json());
// Set EJS as the view engine
app.set("view engine", "ejs");// index.html
app.set("views", path.join(__dirname, "views"));
// Middleware for logging HTTP requests
app.use(morgan("combined"));
// Connect to MongoDB
mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
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
// Use routers
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
    //const isSignUp = false; 
    const isSignUp = req.query.signup === 'true'; // Example logic to determine signup state
    res.render('index', { isSignUp });
});
app.get('/home', (req, res)=>{
    
})
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
