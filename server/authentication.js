const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const baseURL = process.env.BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://www.qbreader.org' : 'http://localhost:3000');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 465,
    secure: true,
    auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
    },
});

transporter.verify((error, _success) => {
    if (error) {
        console.log(error);
        throw error;
    }
});


const salt = process.env.SALT ? process.env.SALT : 'salt';
const secret = process.env.SECRET ? process.env.SECRET : 'secret';


const users = require('../database/users');

/**
 * Stores the timestamp of the most recent email sent to a user.
 * The timestamp is used to verify that the user clicked the link within 15 minutes.
 * The timestamp is the number of milliseconds since January 1, 1970.
 * @type {{String: Number}}
 */
const activeEmailTokens = {};


/**
 * Check whether or not the given username and password are valid.
 * @param {String} username - username of the user you are trying to retrieve.
 * @param {String} password - plaintext password to check.
 * @returns {Promise<Boolean>}
 */
async function checkPassword(username, password) {
    return await users.getUserField(username, 'password') === saltAndHashPassword(password);
}


/**
 * Checks that the token is valid and stores the corrent username.
 * `checkToken` guarantees that the username is in the database if the token is valid.
 * @param {String} username
 * @param {String} token
 * @returns {Boolean} True if the token is valid, and false otherwise.
 */
function checkToken(username, token, checkEmailVerification = false) {
    return jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return false;
        } else {
            return (decoded.username === username) && (!checkEmailVerification || decoded.verifiedEmail);
        }
    });
}


/**
 * Creates a new token for the given username.
 * This token may be used for authentication purposes.
 * @param {String} username
 * @returns A JWT token.
 */
function generateToken(username, verifiedEmail = false) {
    return jwt.sign({ username, verifiedEmail }, secret);
}


/**
 *
 * @param {String} password
 * @returns Base64 encoded hashed password.
 */
function saltAndHashPassword(password) {
    password = salt + password + salt;
    const hash = crypto.createHash('sha256').update(password).digest('base64');
    const hash2 = crypto.createHash('sha256').update(hash).digest('base64');
    const hash3 = crypto.createHash('sha256').update(hash2).digest('base64');
    return hash3;
}


async function sendVerificationEmail(username) {
    const email = await users.getUserField(username, 'email');
    const user_id = await users.getUserId(username);
    const timestamp = Date.parse((new Date()).toString());
    const token = jwt.sign({ user_id, timestamp }, secret);
    const url = `${baseURL}/auth/verify-email?user_id=${user_id}&token=${token}`;
    const message = {
        from: 'info@qbreader.org',
        to: email,
        subject: 'Verify your email address',
        text: `Click this link to verify your email address: ${url} This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.`,
        html: `<p>Click this link to verify your email address: <a href="${url}">${url}</a></p> <p>This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.</p>`,
    };
    transporter.sendMail(message, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log(`Email sent: ${info.response}`);
            activeEmailTokens[user_id] = timestamp;
        }
    });
}


function updatePassword(username, newPassword) {
    return users.updateUser(username, { password: saltAndHashPassword(newPassword) });
}


function verifyEmailLink(user_id, token) {
    const expirationTime = 1000 * 60 * 15; // 15 minutes
    return jwt.verify(token, secret, (err, decoded) => {
        if (err) {
            return false;
        }

        const timestamp = parseInt(decoded.timestamp);
        if (isNaN(timestamp)) {
            return false;
        }

        if (decoded.user_id !== user_id) {
            return false;
        }

        if (activeEmailTokens[user_id] !== timestamp) {
            return false;
        }

        delete activeEmailTokens[user_id];

        if (new Date() - timestamp > expirationTime) {
            return false;
        }

        users.verifyEmail(user_id);
        return true;
    });
}


module.exports = {
    checkPassword,
    checkToken,
    generateToken,
    saltAndHashPassword,
    sendVerificationEmail,
    updatePassword,
    verifyEmailLink,
};
