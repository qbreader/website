import { teams } from './collections.js';

/**
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {ObjectId} options.newOwnerId
 * @returns {Promise<Boolean>}
 */
async function transferTeamOwnership ({ setId, ownerId, newOwnerId }) {
  if (ownerId.equals(newOwnerId)) {
    return false;
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId, members: newOwnerId }, { $set: { owner: newOwnerId } });
  return modifiedCount > 0;
}

export default transferTeamOwnership;
