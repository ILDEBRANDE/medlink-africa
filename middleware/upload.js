const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };
ensureDir('uploads/cvs');
ensureDir('uploads/licenses');

const cvStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/cvs/'),
    filename: (req, file, cb) => cb(null, 'cv-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const licenseStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/licenses/'),
    filename: (req, file, cb) => cb(null, 'license-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and Word documents are allowed'), false);
    }
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const uploadCV = multer({ storage: cvStorage, fileFilter, limits: { fileSize: MAX_SIZE } });
const uploadLicense = multer({ storage: licenseStorage, fileFilter, limits: { fileSize: MAX_SIZE } });

module.exports = { uploadCV, uploadLicense };
