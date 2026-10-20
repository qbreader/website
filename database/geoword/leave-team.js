import { teams } from './collections.js';

/**
 * Removes a user from their team in a set, deleting the team if they were its last member.
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<Boolean>} whether the user was on a team
 */
async function leaveTeam (setId, userId) {
  const team = await teams.findOneAndUpdate({ 'set._id': setId, members: userId }, { $pull: { members: userId } }, { returnDocument: 'after' });
  if (!team) {
    return false;
  }

  // Filtered on the empty array, so a member who joined in the meantime keeps the team.
  await teams.deleteOne({ _id: team._id, members: { $size: 0 } });
  return true;
}

export default leaveTeam;
