const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

exports.getProfile = async (req, res) => {
    const userId = req.user.id; // is user autentif

    try {
        const [rows, fields] = await db.promise().query(`SELECT first_name, last_name, email, profile_pic FROM users WHERE id = ?`, [userId]);

        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            res.status(404).json({error: 'User not found'});
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({error: 'Internal server error'});
    }
};

exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const {first_name, last_name, email} = req.body;

    console.log("User ID:", userId);
    console.log("First Name:", first_name);
    console.log("Last Name:", last_name);
    console.log("Email:", email);

    try {
        const query = `UPDATE users SET first_name = ?, last_name = ?, email = ? WHERE id = ?`;
        const values = [first_name, last_name, email, userId]
        await db.promise().query(query, values );
        res.status(200).json({success: true, message: 'Profile updated successfully'});
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
};

exports.uploadProfilePic = async (req, res) => {
    const userId = req.user.id;
    //const profilePicPath = req.file.path; // path la img incarcata
    const profilePicUrl = `/uploads/${req.file.filename}`;

    console.log('Received file:', req.file); //fisier incarcat
    console.log('User ID:', userId);

    try {
        const query = `UPDATE users SET profile_pic = ? WHERE id = ?`;
        await db.promise().query(query, [profilePicUrl, userId]);
        res.status(200).json({success: true, profilePicUrl: profilePicUrl});
    } catch (error) {
        console.error('Error updating profile picture:', error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
};

exports.deleteAccount = async (req, res) => {
    const userId = req.user.id;

    try {
        // sterg favorite
        const deleteFavoritesQuery = `DELETE FROM favorite WHERE user_id = ?`;
        await db.promise().query(deleteFavoritesQuery, [userId]);

        // sterg din winners row-urile asociate cu userId ca winner_id
        const deleteWinnersByWinnerQuery = `DELETE FROM winners WHERE winner_id = ?`;
        await db.promise().query(deleteWinnersByWinnerQuery, [userId]);

        // sterg inregistrarile din winners asociate picturilor utilizatorului
        const deleteWinnersByPaintingQuery = `DELETE FROM winners WHERE painting_id IN (SELECT id_painting FROM auction_paintings WHERE id_user = ?)`;
        await db.promise().query(deleteWinnersByPaintingQuery, [userId]);

        // sterg din auctioneer rowurile asociate atat picturilor cat si userului ca auctioneer
        const deleteAuctioneerByPaintingQuery = `DELETE FROM auctioneer WHERE id_painting IN (SELECT id_painting FROM auction_paintings WHERE id_user = ?)`;
        await db.promise().query(deleteAuctioneerByPaintingQuery, [userId]);

        const deleteAuctioneerByUserQuery = `DELETE FROM auctioneer WHERE id_auctioneer = ?`;
        await db.promise().query(deleteAuctioneerByUserQuery, [userId]);

        // sterg din auction_paintings rowurile asociate userului
        const deleteAuctionPaintingsQuery = `DELETE FROM auction_paintings WHERE id_user = ?`;
        await db.promise().query(deleteAuctionPaintingsQuery, [userId]);
        const query = `DELETE FROM users WHERE id = ?`;
        await db.promise().query(query, [userId]);
        res.status(200).json({success: true, message: 'Account deleted successfully'});
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({success: false, message: 'Server error'});
    }
};