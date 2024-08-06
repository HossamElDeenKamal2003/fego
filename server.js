const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
require('dotenv').config(); 
const user = require('./router/userRouter/userRouter');
const driver = require('./router/userRouter/driverRouter');
const book = require('./router/bookTrip/bookingRouting');

const app = express();
const path = require('path');

// Set EJS as the view engine
app.set('view engine', 'ejs');
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));


// Set the directory where EJS views are located
app.set('views', path.join(__dirname, 'views'));
// Middleware setup
app.get('/', (req, res, next)=> {
    res.send("Express");
});
    
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb+srv://hossamkamal:hossam_2003@cluster0.tv0kv5b.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
    console.log('MongoDB connected');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure code
});

// Middleware for logging HTTP requests
app.use(morgan('combined')); // Using 'combined' format for detailed logging

app.use('/auth', user);
app.use('/authdriver', driver);
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
