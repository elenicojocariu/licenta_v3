const connection = require('../config/db');
const nodemailer = require("nodemailer");

exports.listPainting = (req, res) => {
    const { name, artistName, startDate, endDate } = req.body;
    const userId = req.user.id;
    const paintingPic = req.file ? req.file.filename : null;

    if (!name || !artistName || !startDate || !endDate || !paintingPic) {
        return res.status(400).send({ message: 'All fields are required.' });
    }

    const query = `
        INSERT INTO auction_paintings (painting_name, artist_name, id_user, painting_pic, start_date, end_date, verified_ok) 
        VALUES (?, ?, ?, ?, ?, ?, 1)
    `;

    connection.query(query, [name, artistName, userId, paintingPic, startDate, endDate], (err, results) => {
        if (err) {
            console.error('Failed to insert painting:', err);
            return res.status(500).send({ message: 'Failed to list painting.' });
        }
        res.status(201).send({ message: 'Painting listed successfully.', paintingId: results.insertId });
        const querySelect = `
            SELECT email 
            FROM users 
            WHERE id = ?
        `;

        connection.query(querySelect, [userId], (err, results) => {
            if (err) {
                console.error('Failed to fetch user email:', err);
                return res.status(500).send({ message: 'Failed to fetch user email.' });
            }

            if (results.length > 0) {
                const userEmail = results[0].email;
                console.log("email", userEmail);
                sendConfirmationEmail(userEmail);
            }
        });
    });

};

exports.getAuctions = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            p.id_painting, 
            p.painting_name, 
            p.artist_name, 
            p.painting_pic, 
            p.start_date, 
            p.end_date, 
            p.id_user AS artist_id,
            a.price AS user_bid
        FROM 
            auction_paintings p
        LEFT JOIN 
            auctioneer a 
        ON 
            p.id_painting = a.id_painting AND a.id_auctioneer = ?
        WHERE 
            p.verified_ok = 1
    `;

    connection.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Failed to fetch auctions:', err);
            return res.status(500).send({ message: 'Failed to fetch auctions.' });
        }
        //console.log(results);
        res.status(200).send(results);
    });
};


const senderEmail = "cojocariu.eleni24@gmail.com";
const password = "idkv egdf cxej tpgr";

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderEmail,
        pass: password,
    },
});

function sendConfirmationEmail(email)
{
    // Setup email data
    let mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'Painting has been listed successfully',
        text: 'Hello! We added your painting to our auction page. \n We will notify you once the auction has ended and the winning bidder is announced. \n Thank you, \n VirtuArt team',
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

exports.submitAuction = (req, res) => {
    console.log("licitatie", req.body)
    const { offerAmount, userId, paintingId } = req.body;

    if (!offerAmount || !userId || !paintingId) {
        console.error('Missing required information.');
        return res.status(400).send({ message: 'Missing required information.' });
    }

    console.log(userId, paintingId, offerAmount)
    const query = `
        INSERT INTO auctioneer ( id_auctioneer, id_painting, price)
        VALUES (?, ?, ?)
    `;

    connection.query(query, [userId, paintingId, offerAmount], (err, results) => {
        if (err) {
            console.error('Failed to submit offer:', err);
            return res.status(500).send({ message: 'Failed to submit offer.' });
        }

        console.log('Offer submitted successfully:', results);
        res.status(200).send({ message: 'Offer submitted successfully', results });
    });
}

exports.checkExistingBid = (req, res) => {
    const { userId, paintingId } = req.body;
    const query = `
        SELECT * FROM auctioneer 
        WHERE id_auctioneer = ? AND id_painting = ?
    `;

    connection.query(query, [userId, paintingId], (err, results) => {
        if (err) {
            console.error('Failed to check existing bid:', err);
            return res.status(500).send({ message: 'Failed to check existing bid.' });
        }
        res.status(200).send({ hasBid: results.length > 0 });
    });
};

exports.checkIfUserWon = (req, res) => {
    const userId = req.user.id;

    const query = `
        SELECT 
            w.painting_id,
            p.painting_name,
            w.final_bid,
            CASE WHEN w.winner_id = ? THEN 'won' 
                 WHEN w.seller_id = ? THEN 'sold' 
                 ELSE NULL 
            END AS status
        FROM
            winners w
        INNER JOIN
            auction_paintings p 
        ON 
            w.painting_id = p.id_painting
        WHERE 
            w.winner_id = ? OR w.seller_id = ?
    `;

    connection.query(query, [userId, userId, userId, userId], (err, results) => {
        if (err) {
            console.error('Failed to check user wins:', err);
            return res.status(500).json({ message: 'Failed to check wins.' });
        }

        res.status(200).json(results);
    });
};
