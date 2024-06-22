const connection = require('../config/db');
const { connectToDatabase } = require('../../config-mongodb/mongodb');


exports.addFavorite = async (req, res) => {
    const { userId, paintingId } = req.body;
    console.log(`Adding favorite: userId=${userId}, paintingId=${paintingId}`);

    if (!userId || !paintingId) {
        return res.status(400).json({ message: 'userId and paintingId are required' });
    }

    try {
        connection.query('INSERT INTO favorite (user_id, painting_id) VALUES (?, ?)', [userId, paintingId], (err, results) => {
            if (err) {
                console.error('Error inserting into MySQL:', err);
                return res.status(500).json({ message: 'Error inserting into MySQL', error: err });
            }

            console.log('Favorite added:', results);
            res.status(201).json({ message: 'Favorite added successfully' });
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'An error occurred', error });
    }
};




// cand bagi o pictura in baza de date la fav, impreuna cu id pune si titlu, imagine, artist si perioada

function extractArtworks(data) {
    let artworks = [];
    data.forEach(periodData => {
        Object.keys(periodData).forEach(periodKey => {
            const period = periodData[periodKey];
            if (Array.isArray(period)) {
                period.forEach(item => {
                    const artistName = item.name || 'Unknown Artist';
                    if (item.artworks && Array.isArray(item.artworks)) {
                        item.artworks.forEach(artwork => {
                            let artworkItem = {
                                image: artwork.image || 'placeholder.jpg',
                                title: artwork.title || 'Untitled',
                                name: artistName,
                                period: periodKey,
                                paintingId: artwork.paintingId
                            };
                            artworks.push(artworkItem);
                        });
                    }
                });
            }
        });
    });
    return artworks;
}

exports.getFavorites = async (req, res) => {
    const userId = req.params.userId;
    console.log(`Fetching favorites for userId: ${userId}`);

    connection.query('SELECT painting_id FROM favorite WHERE user_id = ?', [userId], async (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            return res.status(500).json({ message: 'Error querying MySQL', error: err });
        }

        const paintingIds = results.map(row => row.painting_id.toString());
        console.log('MySQL paintingIds:', paintingIds);

        try {
            const db = await connectToDatabase();
            console.log('Connected to MongoDB');

            // Debug: Verify connection and collection
            const collection = db.collection('data');
            const count = await collection.countDocuments();
            console.log(`Number of documents in 'data' collection: ${count}`);

            // Fetch all documents in 'data' collection
            const periods = await collection.find().toArray();
            console.log('MongoDB periods found:', JSON.stringify(periods, null, 2));

            const allArtworks = extractArtworks(periods);
            const favoriteArtworks = allArtworks.filter(artwork => paintingIds.includes(artwork.paintingId));
            console.log('Favorite artworks:', JSON.stringify(favoriteArtworks, null, 2));

            res.json(favoriteArtworks);
        } catch (error) {
            console.error('Error querying MongoDB:', error);
            return res.status(500).json({ message: 'Error querying MongoDB', error });
        }
    });
};

exports.removeFavorite = async (req, res) => {
    try {
        const { userId, paintingId } = req.body;

        // Șterge înregistrarea din baza de date
        const result = await Favorite.deleteOne({ userId: userId, paintingId: paintingId });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Pictura a fost ștearsă din favorite cu succes!' });
        } else {
            res.status(404).json({ message: 'Pictura nu a fost găsită în favorite.' });
        }
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'A apărut o eroare la ștergerea picturii din favorite.' });
    }
};