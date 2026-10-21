import { teams } from './collections.js';

/**
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {ObjectId} options.memberId
 * @returns {Promise<Boolean>}
 */
async function removeTeamMember ({ setId, ownerId, memberId }) {
  if (ownerId.equals(memberId)) {
    return false;
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId, members: memberId }, { $pull: { members: memberId } });
  return modifiedCount > 0;
}

export default removeTeamMember;
