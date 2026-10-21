import { teams } from './collections.js';

/**
 * @param {ObjectId} setId
 * @param {String} teamName
 * @returns {Promise<Object | null>}
 */
async function getTeamByName (setId, teamName) {
  return await teams.findOne({ 'set._id': setId, teamName }, { collation: { locale: 'en', strength: 2 } });
}

export default getTeamByName;
