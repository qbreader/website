import { usernameToId, users } from './collections.js';

/**
 * Get the user ID of the user with the given username.
 * @param {String} username
 * @returns {Promise<ObjectId | null>} The user ID of the user with the given username, or null if it doesn't exist.
 */
async function getUserId (username) {
  if (usernameToId[username]) {
    return usernameToId[username];
  }

  const user = await users.findOne({ username });

  if (!user) {
    return null;
  }

  usernameToId[username] = user._id;
  return user._id;
}

export default getUserId;
