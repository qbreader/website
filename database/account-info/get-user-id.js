import { username_to_id, users } from './collections.js';

/**
 * Get the user ID of the user with the given username.
 * @param {String} username
 * @returns {Promise<ObjectId | null>} The user ID of the user with the given username, or null if it doesn't exist.
 */
async function getUserId(username) {
    if (username_to_id[username]) {
        return username_to_id[username];
    }

    const user = await users.findOne({ username: username });

    if (!user) {
        return null;
    }

    username_to_id[username] = user._id;
    return user._id;
}

export default getUserId;
