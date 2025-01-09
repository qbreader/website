import { validateUsername } from '../../server/authentication.js';
import { users, usernameToId, idToUsername } from './collections.js';
import getUserId from './get-user-id.js';

/**
 *
 * @param {string} username
 * @param {Object} values -
 * @returns {Promise<boolean>}
 */
async function updateUser (username, values) {
  const user = await users.findOne({ username });

  if (!user) {
    return false;
  }

  if (values.email && values.email !== user.email) {
    values.verifiedEmail = false;
  }

  for (const field of ['username', 'password', 'email', 'verifiedEmail']) {
    if (Object.prototype.hasOwnProperty.call(values, field)) {
      user[field] = values[field];
    }
  }

  if (values.username && values.username !== username) {
    if (await getUserId(values.username)) {
      return false;
    }

    if (!validateUsername(values.username)) {
      return false;
    }

    usernameToId[values.username] = user._id;
    idToUsername[user._id] = values.username;
    delete usernameToId[username];
  }

  await users.updateOne({ username }, { $set: user });
  return true;
}

export default updateUser;
