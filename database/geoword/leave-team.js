import { teams } from './collections.js';
import getTeam from './get-team.js';

/**
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
