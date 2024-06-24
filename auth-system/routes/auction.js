const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const auctionController = require('../controllers/auctionController');
const multer = require('multer');
const path = require('path');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads-paintings/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Păstrează extensia originală
    }
});

const upload = multer({storage: storage});

router.post('/list', authMiddleware.authenticate, upload.single('paintingPic'), auctionController.listPainting);

module.exports = router;