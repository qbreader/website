import banList from './moderation/banned-usernames.js';
import { sendEmail } from './email.js';

import getUserField from '../database/account-info/get-user-field.js';
import getUserId from '../database/account-info/get-user-id.js';
import getVerifiedUsernamesByEmail from '../database/account-info/get-verified-usernames-by-email.js';
import updateUser from '../database/account-info/update-user.js';
import verifyEmail from '../database/account-info/verify-email.js';

import { createHash } from 'crypto';
import jsonwebtoken from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
const { sign, verify } = jsonwebtoken;

const baseURL = process.env.BASE_URL ?? (process.env.NODE_ENV === 'production' ? 'https://www.qbreader.org' : 'http://localhost:3000');

const salt = process.env.SALT ? process.env.SALT : 'salt';
const secret = process.env.SECRET ? process.env.SECRET : 'secret';

/**
 * Stores the timestamp of the most recent email sent to a user.
 * The timestamp is used to verify that the user clicked the link within 15 minutes.
 * The timestamp is the number of milliseconds since January 1, 1970.
 * @type {{String: Number}}
 */
const activeVerifyEmailTokens = {};
const activeResetPasswordTokens = {};

/**
 * Check whether or not the given username and password are valid.
 * @param {String} username - username of the user you are trying to retrieve.
 * @param {String} password - plaintext password to check.
 * @returns {Promise<Boolean>}
 */
export async function checkPassword (username, password) {
  return await getUserField(username, 'password') === saltAndHashPassword(password);
}

/**
 * Checks that the token is valid and stores the corrent username.
 * `checkToken` guarantees that the username is in the database if the token is valid.
 * @param {String} username
 * @param {String} token
 * @returns {Boolean} True if the token is valid, and false otherwise.
 */
export function checkToken (username, token, checkEmailVerification = false) {
  return verify(token, secret, (err, decoded) => {
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
export function generateToken (username, verifiedEmail = false) {
  return sign({ username, verifiedEmail }, secret, { expiresIn: '7d' });
}

/**
 * Turns what a user typed into a login box into the username of an account.
 * The identifier is either a username, or the verified email of exactly one account.
 *
 * The email is only a lookup key: the returned value is always a username,
 * so the email never needs to leave the server.
 *
 * Email is tried before username so that nobody can shadow a victim's email login
 * by registering the victim's email address as their username.
 * @param {string} identifier
 * @returns {Promise<string>} The username to authenticate as.
 *  It is not guaranteed to exist, so callers must still check the password.
 */
export async function resolveLoginIdentifier (identifier) {
  const email = identifier.trim();
  if (validateEmail(email)) {
    const usernames = await getVerifiedUsernamesByEmail(email);
    // more than one match is ambiguous, so the email cannot be used to log in
    if (usernames.length === 1) {
      return usernames[0];
    }
  }

  return identifier;
}

/**
 *
 * @param {String} password
 * @returns Base64 encoded hashed password.
 */
export function saltAndHashPassword (password) {
  password = salt + password + salt;
  const hash = createHash('sha256').update(password).digest('base64');
  const hash2 = createHash('sha256').update(hash).digest('base64');
  const hash3 = createHash('sha256').update(hash2).digest('base64');
  return hash3;
}

export async function sendResetPasswordEmail (username) {
  const email = await getUserField(username, 'email');
  const userId = await getUserId(username);
  if (!userId || !email) {
    return false;
  }

  const timestamp = Date.now();
  const token = sign({ user_id: userId, timestamp }, secret);
  const url = `${baseURL}/auth/verify-reset-password?user_id=${userId}&token=${token}`;

  const info = await sendEmail({
    to: email,
    subject: 'QBReader: Reset your password',
    text: `Click this link to reset your password: ${url} This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it. Do not reply to this email; this inbox is unmonitored.`,
    html: `<p>Click this link to reset your password: <a href="${url}">${url}</a></p> <p>This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.</p> <i>Do not reply to this email; this inbox is unmonitored.</i>`
  });

  if (!info) {
    return false;
  }

  // console.log(`Email sent: ${info.response}`);
  activeResetPasswordTokens[userId] = timestamp;
  return true;
}

export async function sendVerificationEmail (username) {
  const email = await getUserField(username, 'email');
  const userId = await getUserId(username);
  if (!userId || !email) {
    return false;
  }

  const timestamp = Date.now();
  const token = sign({ user_id: userId, timestamp }, secret);
  const url = `${baseURL}/auth/verify-email?user_id=${userId}&token=${token}`;

  const info = await sendEmail({
    to: email,
    subject: 'QBReader: Verify your email address',
    text: `Click this link to verify your email address: ${url} This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it. Do not reply to this email; this inbox is unmonitored.`,
    html: `<p>Click this link to verify your email address: <a href="${url}">${url}</a></p> <p>This link will expire in 15 minutes. Only the most recent link will work. If you did not request this email, please ignore it.</p> <i>Do not reply to this email; this inbox is unmonitored.</i>`
  });

  if (!info) {
    return false;
  }

  // console.log(`Email sent: ${info.response}`);
  activeVerifyEmailTokens[userId] = timestamp;
  return true;
}

export function updatePassword (username, newPassword) {
  return updateUser(username, { password: saltAndHashPassword(newPassword) });
}

/**
 *
 * @param {string} email
 * @returns {boolean} True if the email is valid, and false otherwise.
 */
export function validateEmail (email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 *
 * @param {string} username
 * @returns {boolean} True if the username is valid, and false otherwise.
 */
export function validateUsername (username) {
  if (!username || typeof username !== 'string') {
    return false;
  }

  if (banList.includes(username.toLowerCase())) {
    return false;
  }

  if (username.length < 1 || username.length > 20) {
    return false;
  }

  // emails are accepted at login, so a username must never be able to look like one
  if (username.includes('@')) {
    return false;
  }

  //more validation needed here in the future

  return true;
}

export async function verifyEmailLink (userId, token) {
  const expirationTime = 1000 * 60 * 15; // 15 minutes
  const linkUserId = verify(token, secret, (err, decoded) => {
    if (err) {
      return false;
    }

    const timestamp = parseInt(decoded.timestamp);
    if (isNaN(timestamp)) {
      return false;
    }

    if (decoded.user_id !== userId) {
      return false;
    }

    if (activeVerifyEmailTokens[userId] !== timestamp) {
      return false;
    }

    delete activeVerifyEmailTokens[userId];

    if (Date.now() - timestamp > expirationTime) {
      return false;
    }

    try { return new ObjectId(userId); } catch (e) { return false; }
  });

  if (!linkUserId) {
    return false;
  }

  // fails if another account already has this email verified
  const { matchedCount } = await verifyEmail(linkUserId);
  return matchedCount > 0;
}

export function verifyResetPasswordLink (userId, token) {
  const expirationTime = 1000 * 60 * 15; // 15 minutes
  return verify(token, secret, (err, decoded) => {
    if (err) {
      return false;
    }

    const timestamp = parseInt(decoded.timestamp);
    if (isNaN(timestamp)) {
      return false;
    }

    if (decoded.user_id !== userId) {
      return false;
    }

    if (activeResetPasswordTokens[userId] !== timestamp) {
      return false;
    }

    delete activeResetPasswordTokens[userId];

    if (Date.now() - timestamp > expirationTime) {
      return false;
    }

    return true;
  });
}
