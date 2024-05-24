import { idToUsername, users } from './collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<String>}
 */
async function getUsername (userId) {
  if (idToUsername[userId]) {
    return idToUsername[userId];
  }

  const user = await users.findOne({ _id: userId });

  if (!user) {
    return null;
  }

  idToUsername[userId] = user.username;
  return user.username;
}

export default getUsername;
