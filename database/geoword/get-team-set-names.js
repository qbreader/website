import { teams } from './collections.js';

/**
 * @param {ObjectId} userId
 * @returns {Promise<String[]>}
 */
async function getTeamSetNames (userId) {
  return await teams.distinct('set.name', { members: userId });
}

export default getTeamSetNames;
