const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
require('dotenv').config();
const authController = require('../controllers/authController');
//const { confirm} = require('../controllers/authController');
//const { register} = require('../controllers/authController');


// Register route
router.post('/register', authController.register);

//confirmation
//router.get('/confirm/:confirmationCode', authController.confirm);

// Login route
router.post('/login', authController.login);

router.post('/verify-password', authMiddleware.authenticate, authController.verifyPassword);
router.post('/change-password', authMiddleware.authenticate, authController.changePassword);


module.exports = router;