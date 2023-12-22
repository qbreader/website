import { users } from './collections.js';

/**
 * Get the user with the given username.
 * @param {String} username
 * @param {Boolean} [showPassword=false] Whether to show the password field.
 */
async function getUser(username, showPassword = false) {
    return await users.findOne(
        { username: username },
        { projection: { password: showPassword ? 1 : 0 } },
    );
}

export default getUser;
