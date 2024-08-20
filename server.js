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
const { findDrivers, findDriversInternal } = require("./controller/booking/userBooking");
const { updateLocation } = require("./controller/booking/driverDest");

const socketHandler = require('./controller/booking/offerWebsocket');
const offerController = require('./controller/booking/offers')
const driverSocketHandler = require('./controller/booking/driverWebsocket');
const tripSocketHandler = require('./controller/booking/allTripswebSocket');
const chatHandler = require('./controller/booking/chating/chatWebsocket');
const {tripStatusHandler,driverDataHandler} = require('./controller/booking/statusTripSockets/acceotTripSockets');
//const driverDataHandler = require('./controller/booking/statusTripSockets/acceotTripSockets');
dotenv.config();
console.log(process.env.NODE_ENV);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware setup
app.use(cors());
app.use(express.json());

// Set EJS as the view engine
app.set("view engine", "ejs");// index.html
app.set("views", path.join(__dirname, "views"));

// Middleware for logging HTTP requests
app.use(morgan("combined"));

// Connect to MongoDB
mongoose
    .connect(process.env.DB_URL, {
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
const createChat = require("./router/chatingRouter/createChat")
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
// Define a root route to serve an EJS page (optional)
app.get("/", (req, res) => {
    res.send("Express");
});

// Track user searches
const userSearches = new Map(); // Map<socketId, searchCriteria>

// WebSocket logic
// io.on("connection", (socket) => {
//     console.log("A user connected");

//     // Handle driver location update event
//     socket.on("updateLocation", async (data) => {
//         const { driverId, longitude, latitude } = data;

//         if (!driverId || longitude === undefined || latitude === undefined) {
//             socket.emit("error", { message: "Driver ID, longitude, and latitude are required" });
//             return;
//         }

//         try {
//             // Call the updateLocation function with the received data
//             const updatedDriver = await updateLocation(driverId, longitude, latitude);

//             // Notify clients about the location update
//             socket.emit("driverLocationUpdated", updatedDriver);

//             // Check if the updated location matches any user's search criteria
//             for (const [socketId, searchCriteria] of userSearches.entries()) {
//                 const { vehicleType, latitude: searchLat, longitude: searchLng } = searchCriteria;

//                 if (vehicleType === updatedDriver.vehicleType) {
//                     const distance = calculateDistance(searchLat, searchLng, latitude, longitude);

//                     if (distance <= 5000) { // Within 5km
//                         io.to(socketId).emit("matchingDriverFound", updatedDriver);
//                     }
//                 }
//             }
//         } catch (error) {
//             console.error("Error updating location:", error);
//             socket.emit("error", { message: error.message });
//         }
//     });

//     // Handle 'findDrivers' event from the client
//     socket.on("findDrivers", async (data) => {
//         const { vehicleType, latitude, longitude } = data;
//         console.log(vehicleType, latitude, longitude);

//         // Track user search
//         userSearches.set(socket.id, { vehicleType, latitude, longitude });

//         try {
//             const drivers = await findDrivers(vehicleType, latitude, longitude);

//             if (drivers.length > 0) {
//                 socket.emit("driversFound", drivers);
//             } else {
//                 socket.emit("noDriversFound", {
//                     message: "No drivers available in your area",
//                 });
//             }
//         } catch (error) {
//             console.log(error);
//             socket.emit("error", { message: error.message });
//         }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//         console.log("A user disconnected");
//         userSearches.delete(socket.id); // Clean up user search data
//     });
// });
// Inside server.js, WebSocket connection handler
// io.on("connection", (socket) => {
//     console.log("A user connected");

//     // Handle offer addition via WebSocket
//     socket.on('addOffer', async (data) => {
//         const { tripId, driverId, offer } = data;

//         if (!tripId || !driverId || !offer) {
//             socket.emit("error", { message: "tripId, driverId, and offer are required" });
//             return;
//         }

//         try {
//             const newOffer = new offerModel({ tripId, driverId, offer });
//             await newOffer.save();

//             // Notify all clients about the new offer
//             io.emit('offerAdded', newOffer);
//         } catch (error) {
//             console.error('Error adding offer:', error);
//             socket.emit('error', { message: error.message });
//         }
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//         console.log("A user disconnected");
//     });
// });

offerController.setSocketInstance(io);

// Initialize WebSocket handler
// socketHandler(io);
socketHandler(io);
tripSocketHandler(io);

driverSocketHandler(io); // Driver-specific WebSocket handler
chatHandler(io);
tripStatusHandler(io);
driverDataHandler(io);
global.io = io;

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
