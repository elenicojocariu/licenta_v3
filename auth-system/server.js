const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const {connectToDatabase} = require('../config-mongodb/mongodb');
const cron = require('node-cron');
const finalizeAuction = require('./controllers/auctionProcessor');
const  axios = require('axios');
const extrusionRoutes = require('./routes/auction')

dotenv.config();

const app = express();
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const favoriteRoutes = require('./routes/favorite');
const auctionRoutes = require('./routes/auction');

app.use(bodyParser.json());

app.use(cors());

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads-paintings', express.static(path.join(__dirname, 'uploads-paintings')));


app.use('/auth', authRoutes);
app.use('/profile', profileRoutes);
app.use('/favorite', favoriteRoutes);
app.use('/auction', auctionRoutes);

app.use('/auction', extrusionRoutes);

app.use(express.json())

app.use(session({
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false} // Seteaza secure: true dacă fol HTTPS
}));

connectToDatabase().then(() => {
    console.log('MongoDB connection established successfully.');
}).catch(err => {
    console.error('MongoDB connection failed:', err);
});
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/login.html'));
});
app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/reset-password.html'));
});
app.get('/api/artworks', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const collection = db.collection('data');
        const data = await collection.find({}).toArray();
        res.json(data);
    } catch (err) {
        console.error('Failed to fetch data from MongoDB', err);
        res.status(500).send('Error fetching data from MongoDB');
    }
});

cron.schedule('0 0 * * *', () => {
    console.log("Running scheduled auction finalization...");
    finalizeAuction();
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);

});

