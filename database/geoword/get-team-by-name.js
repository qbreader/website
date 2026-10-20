import { teams } from './collections.js';

/**
 * @param {ObjectId} setId
 * @param {String} teamName - matched ignoring case, like the unique index on team names
 * @returns {Promise<Object | null>} the team in the set with that name, or null
 */
async function getTeamByName (setId, teamName) {
  return await teams.findOne({ 'set._id': setId, teamName }, { collation: { locale: 'en', strength: 2 } });
}

export default getTeamByName;
