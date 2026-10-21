import { teams } from './collections.js';
import getTeam from './get-team.js';

/**
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<'left' | 'only-member' | 'not-a-member'>}
 */
async function leaveTeam (setId, userId) {
  const { modifiedCount } = await teams.updateOne(
    { 'set._id': setId, members: userId, 'members.1': { $exists: true } },
    { $pull: { members: userId } }
  );
  if (modifiedCount > 0) {
    return 'left';
  }

  return await getTeam(setId, userId) ? 'only-member' : 'not-a-member';
}

export default leaveTeam;
