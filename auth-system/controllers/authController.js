const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');

//const { sendConfirmationEmail } = require('../services/emailService');

// Register user
exports.register = async (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const confirmationCode = crypto.randomBytes(20).toString('hex');


    const query = `INSERT INTO users (first_name, last_name, email, password, confirmation_code, is_confirmed) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [first_name, last_name, email, hashedPassword, confirmationCode, false];

    db.query(query, values, (err, results) => {
        if (err) {
            res.status(500).send({message: err.message});
            return;
        }
        sendConfirmationEmail(email, confirmationCode);
        res.status(200).send({message: 'User registered successfully! Please check your email to confirm your account.'});
    });
};

exports.confirm = (req, res) => {
    const {confirmationCode} = req.params;

    const query = `SELECT * FROM users WHERE confirmation_code = ?`;
    db.query(query, [confirmationCode], (err, results) => {
        if (err) {
            res.status(500).send({message: err.message});
            return;
        }

        if (results.length === 0) {
            res.status(404).send({message: 'User not found.'});
            return;
        }

        const user = results[0];
        const updateQuery = `UPDATE users SET is_confirmed = ?, confirmation_code = ? WHERE id = ?`;
        db.query(updateQuery, [true, '', user.id], (err, results) => {
            if (err) {
                res.status(500).send({message: err.message});
                return;
            }
            res.status(200).send({message: 'Account confirmed successfully!'});
        });
    });
};

// Login user
exports.login = (req, res) => {
    const {email, password} = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(400).json({message: 'Email or password is incorrect'});
        } else {
            const user = results[0];
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.status(400).json({message: 'Email or password is incorrect'});
            } else {
                const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
                res.status(200).json({message: 'Login successfulllll', token});
            }
        }
    });
};

//vf parola curenta
exports.verifyPassword = async (req, res) => {
    const userId = req.user.id;
    const {password} = req.body;

    db.query('SELECT password FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(400).json({message: 'User not found'});
        } else {
            const user = results[0];
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.status(400).json({message: 'Current password is incorrect'});
            } else {
                res.status(200).json({message: 'Password verified'});
            }
        }
    });
};
//schimba parola
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const {newPassword} = req.body;
    const hashedPassword = bcrypt.hashSync(newPassword, 8);

    const query = `UPDATE users SET password = ? WHERE id = ?`;
    db.query(query, [hashedPassword, userId], (err, results) => {
        if (err) {
            res.status(500).send({message: err.message});
            return;
        }
        res.status(200).send({message: 'Password updated successfully'});
    });
};
//doar pentru implementare favorite
exports.verifyToken = (req, res) => {
    const userId = req.user.id;
    res.status(200).json({ userId });
};

