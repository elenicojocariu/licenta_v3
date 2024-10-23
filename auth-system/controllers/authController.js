const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');


// Register user
exports.register = async (req, res) => {
    const { first_name, last_name, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    const confirmationCode = crypto.randomBytes(20).toString('hex');

    const query = `INSERT INTO users (first_name, last_name, email, password, confirmation_code, is_confirmed) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [first_name, last_name, email, hashedPassword, confirmationCode, false];

    db.query(query, values, (err, results) => {
        if (err) {
            return res.status(500).send({ message: err.message });
        }

        // Trimite emailul de confirmare
        sendConfirmationEmail(email, confirmationCode);

        // Răspuns către frontend cu mesaj de succes
        res.status(200).json({
            message: 'User registered successfully! Please check your email to confirm your account.'
        });
    });
};


// Confirmation route - /auth/confirm/:confirmationCode
exports.confirm = (req, res) => {
    const {confirmationCode} = req.params;

    // Look up the user by confirmation code
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

        // Update the is_confirmed flag and clear the confirmation code
        const updateQuery = `UPDATE users SET is_confirmed = ?, confirmation_code = ? WHERE id = ?`;
        db.query(updateQuery, [true, '', user.id], (err, results) => {
            if (err) {
                res.status(500).send({message: err.message});
                return;
            }

            // Redirect to login page after confirmation
            //res.status(200).send({ message: 'Account confirmed successfully!' });
            //res.redirect('/login.html'); // Ensure this line is placed correctly
            res.redirect('/confirmation-success.html');

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

            // Check if the user has confirmed their email
            if (user.is_confirmed === 0) { //----------------------------------------------atentie aici ca trb ==1
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
                    userId: user.id // Return user ID
                });
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
    res.status(200).json({userId});
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

function sendConfirmationEmail(first_name, last_name, email, confirmationCode) {
    const confirmUrl = `http://localhost:5000/auth/confirm/${confirmationCode}`;

    let mailOptions = {
        from: senderEmail,
        to: email,
        subject: 'Account created successfully',
        html: `
            <h3>Hello, ${first_name} ${last_name}!</h3>
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

exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    console.log("emaill: ", email);

    // Găsește utilizatorul după email
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
            console.error('Database query error:', err); // Add this line for more debugging

            return res.status(500).send({ message: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(404).send({ message: 'No user found with that email' });
        }

        const user = results[0];
        const resetToken = crypto.randomBytes(20).toString('hex');
        console.log('Generated reset token:', resetToken); // Log pentru tokenul generat

        // Salvează tokenul în baza de date (de exemplu, într-un câmp `reset_password_token`)
        db.query('UPDATE users SET reset_password_token = ? WHERE id = ?', [resetToken, user.id], (err) => {
            if (err) {
                return res.status(500).send({ message: 'Database error' });
            }

            // Trimite emailul cu linkul de resetare
            const resetUrl = `http://localhost:5000/reset-password?token=${resetToken}`;
            const mailOptions = {
                from: 'cojocariu.eleni24@gmail.com',
                to: email,
                subject: 'Password Reset',
                html: `
                    <p>You requested a password reset.</p>
                    <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
                `
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return res.status(500).send({ message: 'Failed to send email' });
                }
                res.status(200).send({ message: 'Password reset email sent' });
            });
        });
    });
};

