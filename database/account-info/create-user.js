import { users } from './collections.js';

/**
 * Creates a new user in the database.
 * @param {string} username - The username of the new user.
 * @param {string} password - The password of the new user.
 * @param {string} email - The email of the new user.
 * @returns {Promise<Object>} The inserted user object.
 */
async function createUser (username, password, email) {
  return await users.insertOne({
    username,
    password,
    email,
    verifiedEmail: false
  });
}

export default createUser;
