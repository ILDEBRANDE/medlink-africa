const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

ensureDir('uploads/photos');

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/photos/'),
    filename: (req, file, cb) => cb(null, 'photo-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
};

const uploadPhoto = multer({ storage, fileFilter });
module.exports = uploadPhoto;