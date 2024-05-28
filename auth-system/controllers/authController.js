const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');
//const { sendConfirmationEmail } = require('../services/emailService');

// Register user
exports.register = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const confirmationCode = crypto.randomBytes(20).toString('hex');



    const query = `INSERT INTO users (first_name, last_name, email, password, confirmation_code, is_confirmed) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [first_name, last_name, email, hashedPassword, confirmationCode, false];

    db.query(query, values, (err, results) => {
        if (err) {
            res.status(500).send({ message: err.message });
            return;
        }
        sendConfirmationEmail(email, confirmationCode);
        res.status(200).send({ message: 'User registered successfully! Please check your email to confirm your account.' });
    });
};

exports.confirm = (req, res) => {
    const { confirmationCode } = req.params;

    const query = `SELECT * FROM users WHERE confirmation_code = ?`;
    db.query(query, [confirmationCode], (err, results) => {
        if (err) {
            res.status(500).send({ message: err.message });
            return;
        }

        if (results.length === 0) {
            res.status(404).send({ message: 'User not found.' });
            return;
        }

        const user = results[0];
        const updateQuery = `UPDATE users SET is_confirmed = ?, confirmation_code = ? WHERE id = ?`;
        db.query(updateQuery, [true, '', user.id], (err, results) => {
            if (err) {
                res.status(500).send({ message: err.message });
                return;
            }
            res.status(200).send({ message: 'Account confirmed successfully!' });
        });
    });
};

// Login user
exports.login = (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(400).json({ message: 'Email or password is incorrect' });
        } else {
            const user = results[0];
            const isMatch = bcrypt.compareSync(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Email or password is incorrect' });
            } else {
                const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.status(200).json({ message: 'Login successful', token });
            }
        }
    });
};
