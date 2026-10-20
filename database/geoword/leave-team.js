import { teams } from './collections.js';
import getTeam from './get-team.js';

/**
 * Removes a user from their team in a set. A team always keeps at least one member, so its last member cannot leave.
 * A team's owner can only leave after handing over ownership.
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<'left' | 'only-member' | 'owner' | 'not-a-member'>}
 */
async function leaveTeam (setId, userId) {
  const { modifiedCount } = await teams.updateOne(
    { 'set._id': setId, members: userId, owner: { $ne: userId }, 'members.1': { $exists: true } },
    { $pull: { members: userId } }
  );
  if (modifiedCount > 0) {
    return 'left';
  }

  const team = await getTeam(setId, userId);
  if (!team) {
    return 'not-a-member';
  }
  return team.members.length === 1 ? 'only-member' : 'owner';
}

export default leaveTeam;
