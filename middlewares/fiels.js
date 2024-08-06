// middlewares/upload.js
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Directory where files will be saved
},
filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Filename with timestamp
}
});

const upload = multer({ storage });

// Middleware to handle multiple image uploads
exports.uploadImages = upload.fields([
{ name: 'licenseImage', maxCount: 1 },
{ name: 'driver_licence_image', maxCount: 1 }
]);
