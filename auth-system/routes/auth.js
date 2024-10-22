const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

require('dotenv').config();
const authController = require('../controllers/authController');
//const { confirm} = require('../controllers/authController');
//const { register} = require('../controllers/authController');

router.post('/register', authController.register);

//confirmation
router.get('/confirm/:confirmationCode', authController.confirm);

router.post('/login', authController.login);

router.post('/verify-password', authMiddleware.authenticate, authController.verifyPassword);
router.post('/change-password', authMiddleware.authenticate, authController.changePassword);

router.get('/verifyToken', authMiddleware.authenticate, authController.verifyToken); //doar pt favorite

module.exports = router;