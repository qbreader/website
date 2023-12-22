import getUser from './get-user.js';

/**
 *
 * @param {String} username
 * @returns {Promise<Boolean>}
 */
async function isAdmin(username) {
    const user = await getUser(username);
    return user?.admin ?? false;
}

export default isAdmin;
