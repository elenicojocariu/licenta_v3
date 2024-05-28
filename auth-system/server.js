const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const path = require('path');

dotenv.config();

const app = express();
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');


// Middleware
app.use(bodyParser.json());

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);

app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Setează secure: true dacă folosești HTTPS
}));

//app.use(fileUpload());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

