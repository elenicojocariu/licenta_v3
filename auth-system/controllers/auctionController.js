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
    const query = `
        SELECT id_painting, painting_name, artist_name, painting_pic, start_date, end_date 
        FROM auction_paintings 
        WHERE verified_ok = 1
    `;

    connection.query(query, (err, results) => {
        if (err) {
            console.error('Failed to fetch auctions:', err);
            return res.status(500).send({ message: 'Failed to fetch auctions.' });
        }
        //console.log(results);
        res.status(200).send(results);
    });
};


const senderEmail = "cojocariu.eleni24@gmail.com";
const password = "jwla mvkh bshz wlnh";

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