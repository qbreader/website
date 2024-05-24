import { users } from './collections.js';

/**
 *
 * @param {string} username
 * @param {string} field
 * @returns {Promise<any | null>}
 */
async function getUserField (username, field) {
  const user = await users.findOne({ username });
  return user ? user[field] : null;
}

export default getUserField;
