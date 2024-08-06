const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/images/');
    },
    filename: function(req, file, cb) {
        cb(null, `${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

const uploadImages = upload.fields([
    { name: 'licenseImage', maxCount: 1 },
    { name: 'driver_licence_image', maxCount: 1 }
]);

module.exports = {
    uploadImages
};
