const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

exports.getProfile = async (req, res) => {
    const userId = req.user.id; // Id-ul utilizatorului autentificat

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
        await db.promise().query(query, [first_name, last_name, email, userId]);
        res.status(200).json({success: true, message: 'Profile updated successfully'});
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({success: false, message: 'Internal server error'});
    }
};

exports.uploadProfilePic = async (req, res) => {
    const userId = req.user.id;
    //const profilePicPath = req.file.path; // Calea către imaginea încărcată
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
        // Șterge favoritele utilizatorului
        const deleteFavoritesQuery = `DELETE FROM favorite WHERE user_id = ?`;
        await db.promise().query(deleteFavoritesQuery, [userId]);


        const query = `DELETE FROM users WHERE id = ?`;
        await db.promise().query(query, [userId]);
        res.status(200).json({success: true, message: 'Account deleted successfully'});
    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({success: false, message: 'Server error'});
    }
};