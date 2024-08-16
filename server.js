const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect to MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for local file storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ storage });

// Import routes
const user = require('./router/userRouter/userRouter');
const driver = require('./router/userRouter/driverRouter');
const book = require('./router/bookTrip/bookingRouting');
const userProfile = require('./router/userProfile/patchUser');
const driverProfile = require('./router/userProfile/patchDriver');
const prices = require('./router/bookTrip/priceRouter');

// Middleware for static files
app.use('/uploads', express.static(uploadDir));

// Use routers
app.use('/auth', user);
app.use('/authdriver', driver);
app.use('/book', book);
app.use('/user-profile', userProfile);
app.use('/driverprofile', driverProfile);
app.use('/prices', prices);

// Root route
app.get('/', (req, res) => res.send('Express'));

// WebSocket connection
io.on('connection', (socket) => {
    console.log('A user connected');

    // Listen for 'findDrivers' event
    socket.on('findDrivers', async (data) => {
        const { vehicleType, latitude, longitude } = data;
        try {
            const drivers = await findDrivers(vehicleType, latitude, longitude);

            if (drivers.length > 0) {
                socket.emit('driversFound', drivers);
            } else {
                socket.emit('noDriversFound', { message: 'No drivers available in your area' });
            }
        } catch (error) {
            console.error(error);
            socket.emit('error', { message: error.message });
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

global.io = io;

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`App running on port ${PORT}`));

// Graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated');
    });
});
