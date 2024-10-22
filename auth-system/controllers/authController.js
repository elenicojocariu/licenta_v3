const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


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
        sendConfirmationEmail(email, confirmationCode); // trimite și codul de confirmare
        res.status(200).send({message: 'User registered successfully! Please check your email to confirm your account.'});
    });

};
// Confirmation route - /auth/confirm/:confirmationCode
exports.confirm = (req, res) => {
    const {confirmationCode} = req.params;

    const query = `SELECT * FROM users WHERE confirmation_code = ?`;
    db.query(query, [confirmationCode], (err, results) => {
        if (err) {
            return res.status(500).send({message: err.message});
        }

        if (results.length === 0) {
            return res.status(404).send({message: 'Invalid confirmation code or user not found.'});
        }

        const user = results[0];

        // Check if the user is already confirmed
        if (user.is_confirmed) {
            return res.status(400).send({message: 'Account is already confirmed.'});
        }

        // Update the user to confirm the account
        const updateQuery = `UPDATE users SET is_confirmed = ?, confirmation_code = ? WHERE id = ?`;
        db.query(updateQuery, [true, '', user.id], (err, updateResults) => {
            if (err) {
                return res.status(500).send({message: err.message});
            }

            // After updating the account status, redirect to login page
            res.status(200).send({message: 'Account confirmed successfully! Please log in.'});

            // OR redirect to frontend login page (client side)
            // res.redirect('/login.html'); // if login.html is the login page in your app
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
        }

        const user = results[0];

        // Check if the user has confirmed their account
        if (!user.is_confirmed) {
            return res.status(400).json({message: 'Please confirm your email before logging in.'});
        }

        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(400).json({message: 'Email or password is incorrect'});
        } else {
            const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '1h'});
            res.status(200).json({
                message: 'Login successful',
                token,
                userId: user.id
            });
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

const senderEmail = "cojocariu.eleni24@gmail.com";
const password = "idkv egdf cxej tpgr";

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderEmail,
        pass: password,
    },
});

function sendConfirmationEmail(email, confirmationCode) {
    const confirmUrl = `http://localhost:5000/login`;

    let mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'Account created successfully',
        html: `
            <h3>Hello!</h3>
            <p>Your account has been created. Please click the button below to activate it:</p>
            
            <a href="${confirmUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Confirm Account</a>
            <p>If the button doesn't work, click the following link: <a href="${confirmUrl}">${confirmUrl}</a></p>
        `

    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}
