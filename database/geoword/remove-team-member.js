import { teams } from './collections.js';

/**
 * Removes a member from the team the user owns. The owner cannot be removed this way:
 * they leave, or hand over ownership first.
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {ObjectId} options.ownerId
 * @param {ObjectId} options.memberId
 * @returns {Promise<Boolean>} whether the user owns a team in the set with that other member on it
 */
async function removeTeamMember ({ setId, ownerId, memberId }) {
  if (ownerId.equals(memberId)) {
    return false;
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, owner: ownerId, members: memberId }, { $pull: { members: memberId } });
  return modifiedCount > 0;
}

export default removeTeamMember;
