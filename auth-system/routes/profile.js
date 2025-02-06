const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware.authenticate);


router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

//pt imagini de profil
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); //nume fisier unic
    }
});
const upload = multer({storage: storage});


router.post('/upload-profile-pic', upload.single('profile-pic'), profileController.uploadProfilePic);

router.delete('/', profileController.deleteAccount);

module.exports = router;
