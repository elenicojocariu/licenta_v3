const connection = require('../config/db');

exports.addFavorite = async (req, res) => {
    const { userId, paintingId, painting_img, painting_name} = req.body;
    console.log(`Adding favorite: userId=${userId}, paintingId=${paintingId}, ${painting_img}, ${painting_name}`);

    if (!userId || !paintingId) {
        return res.status(400).json({ message: 'userId and paintingId are required' });
    }

    try {
        connection.query('INSERT INTO favorite (user_id, painting_id, painting_img, painting_name) VALUES (?, ?, ?, ?)', [userId, paintingId, painting_img, painting_name], (err, results) => {
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


exports.getFavorites = async (req, res) => {
    const userId = req.params.userId;
    //console.log(`Fetching favorites for userId: ${userId}`);

    connection.query('SELECT painting_id, painting_img, painting_name FROM favorite WHERE user_id = ?', [userId], async (err, results) => {
        if (err) {
            console.error('Error querying MySQL:', err);
            return res.status(500).json({ message: 'Error querying MySQL', error: err });
        }

        //console.log('MySQL paintingIds:', results);
        res.status(200).json(results);
    });
};

exports.removeFavorite = async (req, res) => {
    try {
        const { userId, paintingId } = req.body;

        // sterg inregistrarea
        const query = `
            DELETE FROM favorite
            WHERE user_id = ? AND painting_id = ?
        `;
        const values = [userId, paintingId];

        connection.query(query, values, (err, result) => {
            if (err) {
                console.error('Error removing favorite:', err);
                res.status(500).json({ message: 'An error occured when deleting the painting from favorite.' });
                return;
            }
            if (result.affectedRows === 1) {
                res.status(200).json({ message: 'The painting has been deleted successfully from favorites.' });
            } else {
                res.status(404).json({ message: 'Pictura nu a fost găsită în favorite.' });
            }
        });
    } catch (error) {
        console.error('Error removing favorite:', error);
        res.status(500).json({ message: 'A apărut o eroare la ștergerea picturii din favorite.' });
    }
};