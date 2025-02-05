const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

exports.getProfile =  (req, res) => {
    const userId = req.user.id; // is user autentif
    const query = `SELECT first_name, last_name, email, profile_pic FROM users WHERE id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user profile ', err);
            return res.status(500).json({error: 'Internal server error.'})
        }
        if (results.length > 0) {
            res.status(200).json(results[0]);
        } else {
            res.status(404).json({error: 'User not found'});
        }
    });
};

exports.updateProfile =  (req, res) => {
    const userId = req.user.id;
    const {first_name, last_name, email} = req.body;

    console.log("User ID:", userId);
    console.log("First Name:", first_name);
    console.log("Last Name:", last_name);
    console.log("Email:", email);

    const query = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`;
    const values = [first_name, last_name, email, userId]
    db.query(query, values, (err, results)=> {
        if (err) {
            console.error('Error updating user profile ', err);
            return res.status(500).json({success: false, message: 'Internal server error'});
        }
        res.status(200).json({success: true, message: 'Profile updated successfully'});
    });
};

exports.uploadProfilePic =  (req, res) => {
    const userId = req.user.id;
    //const profilePicPath = req.file.path; // path la img incarcata
    const profilePicUrl = `/uploads/${req.file.filename}`;

    console.log('Received file:', req.file); //fisier incarcat
    console.log('User ID:', userId);

    const query = `UPDATE users SET profile_pic = ? WHERE id = ?`;
     db.query(query, [profilePicUrl, userId], (err, results)=> {
         if (err) {
             console.error('Error updating profile picture ', err);
             return res.status(500).json({success: false, message: 'Internal server error'});
         }
         res.status(200).json({success: true, profilePicUrl: profilePicUrl});
     });
};

exports.deleteAccount =  (req, res) => {
    const userId = req.user.id;

    // sterg favorite
    const deleteFavoritesQuery = `DELETE FROM favorite WHERE user_id = ?`;
    db.query(deleteFavoritesQuery, [userId], (err)=> {
        if (err) {
            return res.status(500).json({success: false, message: 'Error deleting favorites', error: err});
        }
        // sterg din winners row-urile asociate cu userId ca winner_id
        const deleteWinnersByWinnerQuery = `DELETE FROM winners WHERE winner_id = ?`;
        db.query(deleteWinnersByWinnerQuery, [userId], (err) => {
            if (err) {
                return res.status(500).json({success: false, message: 'Error deleting winners', error: err});
            }
            // sterg inregistrarile din winners asociate picturilor utilizatorului
            const deleteWinnersByPaintingQuery = `DELETE FROM winners WHERE painting_id IN (SELECT id_painting FROM auction_paintings WHERE id_user = ?)`;
            db.query(deleteWinnersByPaintingQuery, [userId], (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        message: 'Error deleting winner paintings',
                        error: err
                    });
                }
                // sterg din auctioneer rowurile asociate atat picturilor cat si userului ca auctioneer
                const deleteAuctioneerByPaintingQuery = `DELETE FROM auctioneer WHERE id_painting IN (SELECT id_painting FROM auction_paintings WHERE id_user = ?)`;
                db.query(deleteAuctioneerByPaintingQuery, [userId], (err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Error deleting auctioneer paintings',
                            error: err
                        });
                    }
                    const deleteAuctioneerByUserQuery = `DELETE FROM auctioneer WHERE id_auctioneer = ?`;
                    db.query(deleteAuctioneerByUserQuery, [userId], (err) => {
                        if (err) {
                            return res.status(500).json({
                                success: false,
                                message: 'Error deleting auctioneer user',
                                error: err
                            });
                        }
                        // sterg din auction_paintings rowurile asociate userului
                        const deleteAuctionPaintingsQuery = `DELETE FROM auction_paintings WHERE id_user = ?`;
                        db.query(deleteAuctionPaintingsQuery, [userId], (err) => {
                            if (err) {
                                return res.status(500).json({
                                    success: false,
                                    message: 'Error deleting auction paintings',
                                    error: err
                                });
                            }
                            const query = `DELETE FROM users WHERE id = ?`;
                            db.query(query, [userId], (err) => {
                                if (err) {
                                    return res.status(500).json({
                                        success: false,
                                        message: 'Error deleting user',
                                        error: err
                                    });
                                }
                                res.status(200).json({success: true, message: 'Account deleted successfully'});

                            });
                        });
                    });
                });
            });
        });
    });
};