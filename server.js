const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware for logging HTTP requests
app.use(morgan('combined')); // Using 'combined' format for detailed logging

// Connect to MongoDB
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDB connected');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure code
    });

// Ensure the directory exists before setting up multer storage
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for local file storage (if needed)
// If using Cloudinary, this might not be necessary
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// Import routes
const user = require('./router/userRouter/userRouter');
const driver = require('./router/userRouter/driverRouter');
const book = require('./router/bookTrip/bookingRouting');

// Middleware for static files
app.use('/uploads', express.static(uploadDir));

// Use routers
app.use('/auth', user);
app.use('/authdriver', driver); // Ensure multer middleware is used correctly in the driverRouter
app.use('/book', book);

// Define a root route to serve an EJS page (optional)
app.get('/', (req, res) => {
    res.send('Express');
});

// Start the server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`App running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Process terminated');
    });
});
