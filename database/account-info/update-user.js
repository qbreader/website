import { users, username_to_id, id_to_username } from './collections.js';
import getUserId from './get-user-id.js';

/**
 *
 * @param {string} username
 * @param {Object} values -
 * @returns {Promise<boolean>}
 */
async function updateUser(username, values) {
    const user = await users.findOne({ username: username });

    if (!user)
        return false;

    if (values.email && values.email !== user.email) {
        values.verifiedEmail = false;
    }

    for (const field of ['username', 'password', 'email', 'verifiedEmail']) {
        if (Object.prototype.hasOwnProperty.call(values, field)) {
            user[field] = values[field];
        }
    }

    if (values.username) {
        if (await getUserId(values.username)) {
            return false;
        }

        username_to_id[values.username] = user._id;
        id_to_username[user._id] = values.username;
        delete username_to_id[username];
    }

    await users.updateOne({ username: username }, { $set: user });
    return true;
}

export default updateUser;
