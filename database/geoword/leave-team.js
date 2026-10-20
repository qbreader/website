import { teams } from './collections.js';

/**
 * Removes a user from their team in a set, deleting the team if they were its last member.
 * A team's owner can only leave once they are the last member; until then they hand over ownership first.
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<'left' | 'owner' | 'not-a-member'>} `owner` if the user is stopped for owning a team that still has other members
 */
async function leaveTeam (setId, userId) {
  // A sole member takes the team with them. Deleting it, rather than pulling the member out, never
  // leaves an empty `members` array, which the unique index would treat as a clash between empty teams.
  const { deletedCount } = await teams.deleteOne({ 'set._id': setId, members: [userId] });
  if (deletedCount > 0) {
    return 'left';
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, members: userId, owner: { $ne: userId } }, { $pull: { members: userId } });
  if (modifiedCount > 0) {
    return 'left';
  }

  return await teams.countDocuments({ 'set._id': setId, members: userId }) > 0 ? 'owner' : 'not-a-member';
}

export default leaveTeam;
