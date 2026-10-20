import { teams } from './collections.js';

/**
 * Removes a user from their team in a set, deleting the team if they were its last member.
 * @param {ObjectId} setId
 * @param {ObjectId} userId
 * @returns {Promise<Boolean>} whether the user was on a team
 */
async function leaveTeam (setId, userId) {
  // A sole member takes the team with them. Deleting it, rather than pulling the member out, never
  // leaves an empty `members` array, which the unique index would treat as a clash between empty teams.
  const { deletedCount } = await teams.deleteOne({ 'set._id': setId, members: [userId] });
  if (deletedCount > 0) {
    return true;
  }

  const { modifiedCount } = await teams.updateOne({ 'set._id': setId, members: userId }, { $pull: { members: userId } });
  return modifiedCount > 0;
}

export default leaveTeam;
