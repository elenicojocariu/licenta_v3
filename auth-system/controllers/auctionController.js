const connection = require('../config/db');

exports.listPainting = (req, res) => {
    const { name, artistName, startDate, endDate } = req.body;
    const userId = req.user.id;
    const paintingPic = req.file ? req.file.filename : null;

    if (!name || !artistName || !startDate || !endDate || !paintingPic) {
        return res.status(400).send({ message: 'All fields are required.' });
    }

    const query = `
        INSERT INTO auction_paintings (painting_name, artist_name, id_user, painting_pic, start_date, end_date, verified_ok) 
        VALUES (?, ?, ?, ?, ?, ?, 0)
    `;

    connection.query(query, [name, artistName, userId, paintingPic, startDate, endDate], (err, results) => {
        if (err) {
            console.error('Failed to insert painting:', err);
            return res.status(500).send({ message: 'Failed to list painting.' });
        }
        res.status(201).send({ message: 'Painting listed successfully.', paintingId: results.insertId });
    });

};

exports.getAuctions = (req, res) => {
    const query = `
        SELECT painting_name, artist_name, painting_pic, start_date, end_date 
        FROM auction_paintings 
        WHERE verified_ok = 1
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Failed to fetch auctions:', err);
            return res.status(500).send({ message: 'Failed to fetch auctions.' });
        }
        console.log(results);
        res.status(200).send(results);
    });
};