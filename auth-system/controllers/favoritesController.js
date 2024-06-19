const { connectToDatabase } = require('../../config-mongodb/mongodb');
const mysql = require('mysql2');
const connection = require('../config/db'); // Importați conexiunea din db.js

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL.');
});

const addFavorite = async (req, res) => {
    const { userId, paintingId } = req.body;
    try {
        const userQuery = 'SELECT * FROM users WHERE id = ?';
        connection.query(userQuery, [userId], async (err, userResults) => {
            if (err) {
                console.error('Error fetching user from MySQL', err);
                return res.status(500).send('Error fetching user from MySQL');
            }
            if (userResults.length === 0) {
                return res.status(404).send('User not found.');
            }
            const db = await connectToDatabase();
            const collection = db.collection('data');
            const document = await collection.findOne({ "artworks.paintingId": paintingId });
            console.log("here: ", paintingId);
            if (document) {
                const artwork = document.artworks.find(artwork => artwork.paintingId === paintingId);
                if (artwork) {
                    const favoriteQuery = 'INSERT INTO favorite (user_id, painting_id) VALUES (?, ?)';
                    connection.query(favoriteQuery, [userId, paintingId], (err, result) => {
                        if (err) {
                            console.error('Error inserting into MySQL', err);
                            return res.status(500).send('Error inserting into MySQL');
                        }
                        console.log(`Adding paintingId ${paintingId} to favorites for userId ${userId}`);
                        res.status(200).json({ message: 'Pictura adăugată la favorite cu succes!' });
                    });
                } else {
                    res.status(404).send('Pictura nu a fost găsită în MongoDB.');
                }
            } else {
                res.status(404).send('Documentul nu a fost găsit în MongoDB.');
            }
        });
    } catch (err) {
        console.error('Error fetching data from MongoDB', err);
        res.status(500).send('Error fetching data from MongoDB');
    }
};

const getFavorites = async (req, res) => {
    const { userId } = req.params;
    try {
        const userQuery = 'SELECT * FROM users WHERE id = ?';
        connection.query(userQuery, [userId], async (err, userResults) => {
            if (err) {
                console.error('Error fetching user from MySQL', err);
                return res.status(500).send('Error fetching user from MySQL');
            }
            if (userResults.length === 0) {
                return res.status(404).send('User not found.');
            }
            const favoriteQuery = 'SELECT painting_id FROM favorite WHERE user_id = ?';
            connection.query(favoriteQuery, [userId], async (err, results) => {
                if (err) {
                    console.error('Error fetching from MySQL', err);
                    return res.status(500).send('Error fetching from MySQL');
                }
                if (results.length === 0) {
                    return res.status(404).send('No favorites found for this user.');
                }
                const paintingIds = results.map(row => row.painting_id);
                const db = await connectToDatabase();
                const collection = db.collection('data');
                const paintings = await collection.find({ "artworks.paintingId": { $in: paintingIds } }).toArray();
                const favoritePaintings = [];
                paintings.forEach(doc => {
                    doc.artworks.forEach(artwork => {
                        if (paintingIds.includes(artwork.paintingId)) {
                            favoritePaintings.push(artwork);
                        }
                    });
                });
                res.json(favoritePaintings);
            });
        });
    } catch (err) {
        console.error('Error fetching data from MongoDB', err);
        res.status(500).send('Error fetching data from MongoDB');
    }
};

const removeFavorite = async (req, res) => {
    const { userId, paintingId } = req.body;
    try {
        const userQuery = 'SELECT * FROM users WHERE id = ?';
        connection.query(userQuery, [userId], async (err, userResults) => {
            if (err) {
                console.error('Error fetching user from MySQL', err);
                return res.status(500).send('Error fetching user from MySQL');
            }
            if (userResults.length === 0) {
                return res.status(404).send('User not found.');
            }
            const query = 'DELETE FROM favorite WHERE user_id = ? AND painting_id = ?';
            connection.query(query, [userId, paintingId], (err, result) => {
                if (err) {
                    console.error('Error deleting from MySQL', err);
                    return res.status(500).send('Error deleting from MySQL');
                }
                res.status(200).json({ message: 'Pictura a fost ștearsă din favorite cu succes!' });
            });
        });
    } catch (err) {
        console.error('Error deleting from MySQL', err);
        res.status(500).send('Error deleting from MySQL');
    }
};

module.exports = {
    addFavorite,
    getFavorites,
    removeFavorite
};
