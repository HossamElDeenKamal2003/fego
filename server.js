const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const user = require('./router/userRouter/userRouter');
const driver = require('./router/userRouter/driverRouter');
const book = require('./router/bookTrip/bookingRouting');

const app = express();
const uploadDir = path.join(__dirname, '..', 'uploads', 'images'); // Adjust path as needed

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Ensure the directory exists before setting up multer storage
// const uploadDir = path.join(__dirname, 'uploads/images');
// if (!fs.existsSync(uploadDir)) {
//     fs.mkdirSync(uploadDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadDir);
//     },
//     filename: function (req, file, cb) {
//         cb(null, `${Date.now()}${path.extname(file.originalname)}`);
//     }
// });

const upload = multer({ storage: storage });

// Middleware setup
app.use(cors());
app.use(express.json());

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use('/uploads/images', express.static(uploadDir));
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

const uploadImages = upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'driver_licence_image', maxCount: 1 }
]);

// Use routers
app.use('/auth', user);
app.use('/authdriver', uploadImages, driver);  // Ensure multer middleware is used correctly
app.use('/book', book);

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
