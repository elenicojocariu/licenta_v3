const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
require('dotenv').config();


// Register user
exports.register =  (req, res) => {
    const {first_name, last_name, email, password} = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8); // 8= cost hashing

    const confirmationCode = crypto.randomBytes(20).toString('hex');

    const query = `INSERT INTO users (first_name, last_name, email, password, confirmation_code, is_confirmed) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [first_name, last_name, email, hashedPassword, confirmationCode, false];

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).send({message: err.message});
        }
        console.log("yooo", results);
        // trim mail de confirmare
        sendConfirmationEmail(first_name, last_name, email, confirmationCode);

        // rasp la front cu mesaj de succes
        res.status(200).json({
            message: 'User registered successfully! Please check your email to confirm your account.'
        });
    });
};


// ruta confirmare /auth/confirm/confirmationcode
exports.confirm = (req, res) => {
    const {confirmationCode} = req.params;

    // caut user dupa cod confirmare
    const query = `SELECT * FROM users WHERE confirmation_code = ?`;
    db.query(query, [confirmationCode], (err, results) => {
        if (results.length === 0) {
            res.status(404).send({message: 'User not found.'});
            return;
        }

        const user = results[0];

        // update is_confirmed
        const updateQuery = `UPDATE users SET is_confirmed = ?, confirmation_code = ? WHERE id = ?`;
        db.query(updateQuery, [true, '', user.id], (err, results) => {
            if (err) {
                res.status(500).send({message: err.message});
                return;
            }

            res.redirect('/confirmation-success.html');

        });
    });
};

// Login user
exports.login = (req, res) => {
    const {email, password} = req.body;
    const query = 'SELECT * FROM users WHERE email = ?'
    db.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).send({message: err.message});
        }
        if (results.length === 0) { //nu exista
            return res.status(400).json({message: 'Email or password is incorrect'});
        } else {
            const user = results[0]; //unicul si singurul utilizator returnat

            // verif daca userul si a confirmat mailul
            if (user.is_confirmed === 0) { //-------------------------atentie aici ca trb ==1 in bd
                return res.status(400).json({message: 'Please confirm your email before logging in.'});
            }

            const isSamePassword = bcrypt.compareSync(password, user.password);
            if (!isSamePassword) {
                return res.status(400).json({message: 'Email or password is incorrect'});
            } else {
                const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '2h'});
                res.status(200).json({
                    message: 'Login successful',
                    token,
                    userId: user.id
                });
            }
        }
    });
};


//vf parola curenta pt ca vrea sa o schimbe------folosit in profile la forgotPassword
exports.verifyPassword =  (req, res) => {
    const userId = req.user.id;
    const {password} = req.body;
    const query = 'SELECT password FROM users WHERE id = ?'

    db.query(query, [userId], (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        }
        if (results.length === 0) {
            return res.status(400).json({message: 'User not found'});
        } else {
            const user = results[0];
            const isSamePassword = bcrypt.compareSync(password, user.password);
            if (!isSamePassword) {
                return res.status(400).json({message: 'Current password is incorrect'});
            } else {
                res.status(200).json({message: 'Password verified'});
            }
        }
    });
};

//schimba parola
exports.changePassword =  (req, res) => {
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
    res.status(200).json({userId});
};


const senderEmail = process.env.SENDER_EMAIL;
const password = process.env.EMAIL_PASSWORD;

let transport_function = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: senderEmail,
        pass: password,
    },
});
//account created bv ti ai facut cont
function sendConfirmationEmail(first_name, last_name, email, confirmationCode) {
    const confirmUrl = `http://localhost:5000/auth/confirm/${confirmationCode}`;

    let mailContent = {
        from: senderEmail,
        to: email,
        subject: 'Account created successfully',
        html: `
            <h3>Hello, ${first_name} ${last_name}!</h3>
            <p>Your account has been created. Please click the button below to activate it:</p>
     
            <a href="${confirmUrl}" style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px;">Confirm Account</a>
            <p>If the button doesn't work, please click on the following link: <a href="${confirmUrl}">${confirmUrl}</a></p>
        `
    };

    transport_function.sendMail(mailContent, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
    });
}

exports.forgotPassword = (req, res) => {
    const {email} = req.body;
    console.log("emaill: ", email);
    const query = 'SELECT * FROM users WHERE email = ?';

    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err); //de ceeee nu merge
            return res.status(500).send({message: 'Database error'});
        }
        if (results.length === 0) {
            return res.status(404).send({message: 'No user found with that email'});
        }
        const user = results[0]; //unic dupa mail
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log('Generated reset token:', resetToken);

        // salvez token in bd
        const queryUpdate = 'UPDATE users SET reset_password_token = ? WHERE id = ?';
        const valuesQuery = [resetToken, user.id];
        db.query(queryUpdate, valuesQuery, (err) => {
            if (err) {
                return res.status(500).send({message: 'Database error'});
            }

            // trim mail cu link de resetare
            const resetUrl = `http://localhost:5000/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: senderEmail,
                to: email,
                subject: 'Password Reset',
                html: `
                    <p>You requested a password reset.</p>
                    <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
                `
            };

            transport_function.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send({message: 'Failed to send email'});
                }
                res.status(200).send({message: 'Password reset email sent'});
            });
        });
    });
};

exports.resetPassword = (req, res) => {
    const {token, newPassword} = req.body;

    const query = 'SELECT * FROM users WHERE reset_password_token = ?'
    db.query(query, [token], (err, results) => {
        if (err) {
            return res.status(500).send({message: 'Database error'});
        }
        if (results.length === 0) {
            return res.status(400).send({message: 'Invalid or expired token'});
        }

        const user = results[0];
        const hashedPassword = bcrypt.hashSync(newPassword, 8);

        // update la parola si elimin token de resetare
        const queryUpdate = 'UPDATE users SET password = ?, reset_password_token = NULL WHERE id = ?';
        db.query(queryUpdate, [hashedPassword, user.id], (err) => {
            if (err) {
                return res.status(500).send({message: 'Database error'});
            }

            res.status(200).send({message: 'Password updated successfully'});
        });
    });
};


