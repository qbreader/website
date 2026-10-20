import { teams } from './collections.js';

/**
 * Removes a user from their team in a set, deleting the team if they were its last member.
 * A team's owner can only leave once they are the last member; until then they hand over ownership first.
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<'left' | 'owner' | 'not-a-member'>} `owner` if the user is stopped for owning a team that still has other members
 */
async function leaveTeam (setId, userId) {
  const team = await teams.findOneAndUpdate(
    { 'set._id': setId, members: userId, $or: [{ owner: { $ne: userId } }, { members: { $size: 1 } }] },
    { $pull: { members: userId } },
    { returnDocument: 'after' }
  );

  if (!team) {
    return await teams.countDocuments({ 'set._id': setId, members: userId }) > 0 ? 'owner' : 'not-a-member';
  }

  // Filtered on the empty array, so a member who joined in the meantime keeps the team.
  await teams.deleteOne({ _id: team._id, members: { $size: 0 } });
  return 'left';
}

export default leaveTeam;
