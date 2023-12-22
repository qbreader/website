import { id_to_username, users } from './collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @returns {Promise<String>}
 */
async function getUsername(user_id) {
    if (id_to_username[user_id]) {
        return id_to_username[user_id];
    }

    const user = await users.findOne({ _id: user_id });

    if (!user) {
        return null;
    }

    id_to_username[user_id] = user.username;
    return user.username;
}

export default getUsername;
