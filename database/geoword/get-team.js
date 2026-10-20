import { teams } from './collections.js';

/**
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<Object | null>} the team the user is on in the set, or null
 */
async function getTeam (setId, userId) {
  return await teams.findOne({ 'set._id': setId, members: userId });
}

export default getTeam;
