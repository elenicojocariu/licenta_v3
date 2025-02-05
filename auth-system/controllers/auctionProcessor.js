const db = require('../config/db');
const nodemailer = require("nodemailer");
require('dotenv').config();



const senderEmail = process.env.SENDER_EMAIL;
const password = process.env.EMAIL_PASSWORD;

let transporter_functions = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderEmail,
        pass: password,
    },
});

function sendWinnerNotification(email, paintingName, pricePaid) {
    const mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'VirtArt: You won the auction!',
        text: `Congratulations! You won the auction for ${paintingName} ! The price you will pay is ${pricePaid}.`,
    };

    transporter_functions.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Failed to send notification email: ", error);
        } else {
            console.log('Notifiction sent: ', info.response);
        }
    });
}

function sendSellerNotification(email, paintingName, pricePaid) {
    const mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'VirtArt: Your painting has been sold!',
        text: `Congratulations! Your painting "${paintingName}" has been sold for ${pricePaid}.`,

    };
    transporter_functions.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Failed to send notification email to seller: ", error);
        } else {
            console.log('Seller notification sent: ', info.response);
        }
    });
}

function finalizeAuction() {
    console.log("Check finished bids...");

    const queryEndedAuctions = `
        SELECT id_painting, id_user AS seller_id, painting_name
        FROM auction_paintings
        WHERE end_date < NOW()
        AND id_painting NOT IN (SELECT painting_id FROM winners)
    `;

    db.query(queryEndedAuctions, (err, results) => {
        if (err) {
            console.error('Error at processing finished bids:', err);
            return;
        }

        results.forEach(auction => {
            const {id_painting, seller_id, painting_name} = auction;

            const queryTopBids = `
                    SELECT id_auctioneer AS user_id, price
                    FROM auctioneer
                    WHERE id_painting = ?
                    ORDER BY price DESC, bid_time ASC
                    LIMIT 2
                            `;

            db.query(queryTopBids, [id_painting], (err, bids) => {
                if (err) {
                    console.error('Error at processing offers for painting:', err);
                    return;
                }

                if (bids.length === 0) {
                    console.log(`No offers for the painting ${id_painting}. The auction failed.`);
                } else {
                    const winnerId = bids[0].user_id;
                    const winningPrice = bids[0].price;
                    const secondHighestBid = bids[1] ? bids[1].price : winningPrice;

                    const insertWinner = `
                        INSERT INTO winners (painting_id, winner_id, final_bid, seller_id)
                        VALUES (?, ?, ?, ?)
                    `;
                    const values = [id_painting, winnerId, secondHighestBid, seller_id]
                    db.query(insertWinner, values, (err, result) => {
                        if (err) {
                            console.error('Error at inserting winner:', err);
                            return;
                        }
                        console.log(`The winner for the painting ${id_painting} added in winners table.`);

                        notifyUsers(winnerId, seller_id, painting_name, secondHighestBid);
                    });
                }
            });
        });
    });
}


function notifyUsers(winnerId, sellerId, paintingName, winningPrice) {
    const getEmailQuery = `SELECT email FROM users WHERE id = ?`;

    db.query(getEmailQuery, [winnerId], (err, results) => {
        if (err) {
            console.error(`Failed to fetch winner s email for user ${winnerId}:`, err);
            return;
        }
        if (results.length > 0) {
            const winnerEmail = results[0].email;
            sendWinnerNotification(winnerEmail, paintingName, winningPrice);
        }
    });

    db.query(getEmailQuery, [sellerId], (err, results) => {
        if (err) {
            console.error(`Failed to fetch seller s email for user ${sellerId}:`, err);
            return;
        }
        if (results.length > 0) {
            const sellerEmail = results[0].email;
            sendSellerNotification(sellerEmail, paintingName, winningPrice);
        }
    });
}

module.exports = finalizeAuction;
