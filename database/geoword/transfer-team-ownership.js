import { teams } from './collections.js';

/**
 * Hands the team the user owns to another of its members.
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {ObjectId} options.newOwnerId
 * @returns {Promise<Boolean>} whether the user owns a team in the set with that other member on it
 */
async function transferTeamOwnership ({ setId, ownerId, newOwnerId }) {
  if (String(ownerId) === String(newOwnerId)) {
    return false;
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId, members: newOwnerId }, { $set: { owner: newOwnerId } });
  return modifiedCount > 0;
}

export default transferTeamOwnership;
