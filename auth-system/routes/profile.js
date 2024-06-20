const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

router.use(authMiddleware.authenticate);


router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

// Configurarea multer pentru încărcarea imaginilor de profil
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads')); // Directorul în care sunt salvate temporar imaginile încărcate
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname); // Generează un nume de fișier unic
    }
});
const upload = multer({storage: storage});

// Ruta pentru încărcarea imaginilor de profil
router.post('/upload-profile-pic', upload.single('profile-pic'), profileController.uploadProfilePic);

router.delete('/', profileController.deleteAccount);

module.exports = router;
