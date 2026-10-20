import { teams } from './collections.js';

/**
 * Renames a team, if the user owns it. A name another team in the set already has surfaces as a
 * MongoServerError with code 11000, from the unique index in tools/geoword/create-indexes.js.
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {String} options.teamName
 * @returns {Promise<Boolean>} whether the user owns a team in the set
 */
async function renameTeam ({ setId, ownerId, teamName }) {
  const { matchedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId }, { $set: { teamName } });
  return matchedCount > 0;
}

export default renameTeam;
