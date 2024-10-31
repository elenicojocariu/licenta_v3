const connection = require('../config/db');
const nodemailer = require("nodemailer");

const senderEmail = "cojocariu.eleni24@gmail.com";
const password = "idkv egdf cxej tpgr";

let transporter = nodemailer.createTransport({
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

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Failed to send notification email: ", error);
        } else {
            console.log('Notifiction sent: ', info.response);
        }
    });
}

function sendSellerNotification(email, paintingName, pricePaid){
    const mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'VirtArt: Your painting has been sold!',
        text: `Congratulations! Your painting "${paintingName}" has been sold for ${pricePaid}.`,

    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error("Failed to send notification email to seller: ", error);
        } else {
            console.log('Seller notification sent: ', info.response);
        }
    });
}

function finalizeAuction() {
    console.log("Verificare licitații încheiate...");

    const queryEndedAuctions = `
        SELECT id_painting, id_user AS seller_id, painting_name
        FROM auction_paintings
        WHERE end_date < NOW()
        AND id_painting NOT IN (SELECT painting_id FROM winners)
    `;

    connection.query(queryEndedAuctions, (err, results) => {
        if (err) {
            console.error('Eroare la preluarea licitațiilor terminate:', err);
            return;
        }

        results.forEach(auction => {
            const { id_painting, seller_id, painting_name } = auction;

            const queryTopBids = `
                SELECT id_auctioneer AS user_id, price
                FROM auctioneer
                WHERE id_painting = ?
                ORDER BY price DESC, offer_time ASC
                LIMIT 2
            `;

            connection.query(queryTopBids, [id_painting], (err, bids) => {
                if (err) {
                    console.error('Eroare la preluarea ofertelor pentru pictura:', err);
                    return;
                }

                if (bids.length === 0) {
                    console.log(`Nicio ofertă pentru pictura ${id_painting}. Licitația a eșuat.`);
                } else {
                    const winnerId = bids[0].user_id;
                    const winningPrice = bids[0].price;
                    const secondHighestBid = bids[1] ? bids[1].price : winningPrice;

                    const insertWinner = `
                        INSERT INTO winners (painting_id, winner_id, final_bid, seller_id)
                        VALUES (?, ?, ?, ?)
                    `;

                    connection.query(insertWinner, [id_painting, winnerId, secondHighestBid, seller_id], (err, result) => {
                        if (err) {
                            console.error('Eroare la inserarea câștigătorului:', err);
                            return;
                        }
                        console.log(`Câștigătorul pentru pictura ${id_painting} a fost adăugat în tabelul winners.`);

                        notifyUsers(winnerId, seller_id, painting_name, winningPrice);
                    });
                }
            });
        });
    });
}




function notifyUsers(winnerId, sellerId, paintingName, winningPrice) {
    const getEmailQuery = `SELECT email FROM users WHERE id = ?`;

    connection.query(getEmailQuery, [winnerId], (err, results) => {
        if (err) {
            console.error(`Failed to fetch winner's email for user ${winnerId}:`, err);
            return;
        }
        if (results.length > 0) {
            const winnerEmail = results[0].email;
            sendWinnerNotification(winnerEmail, paintingName, winningPrice);
        }
    });

    connection.query(getEmailQuery, [sellerId], (err, results) => {
        if (err) {
            console.error(`Failed to fetch seller's email for user ${sellerId}:`, err);
            return;
        }
        if (results.length > 0) {
            const sellerEmail = results[0].email;
            sendSellerNotification(sellerEmail, paintingName, winningPrice);
        }
    });
}
module.exports = finalizeAuction;
