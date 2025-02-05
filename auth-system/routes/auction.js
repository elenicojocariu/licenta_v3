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
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({storage: storage});

router.post('/list', authMiddleware.authenticate, upload.single('paintingPic'), auctionController.listPainting);


router.get('/auctions',authMiddleware.authenticate, auctionController.getAuctions);
router.post('/submit-offer', authMiddleware.authenticate, auctionController.submitAuction);

//router.post('/check-bid', authMiddleware.authenticate, auctionController.checkExistingBid);

router.get('/check-win', authMiddleware.authenticate, auctionController.checkIfUserWon);


module.exports = router;