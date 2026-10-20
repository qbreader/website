import { teams } from './collections.js';

/**
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {String} options.teamName
 * @returns {Promise<Boolean>}
 */
async function renameTeam ({ setId, ownerId, teamName }) {
  const { matchedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId }, { $set: { teamName } });
  return matchedCount > 0;
}

export default renameTeam;
