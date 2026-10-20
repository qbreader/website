import { teams } from './collections.js';

/**
 * Creates a team with its creator as the only member.
 *
 * Does not check that the name is free or that the user is on no other team: unique indexes on `teams` do,
 * atomically, so concurrent requests cannot both succeed:
 *   - `{ 'set._id': 1, teamName: 1 }`, with collation `{ locale: 'en', strength: 2 }` (names are unique ignoring case)
 *   - `{ 'set._id': 1, members: 1 }` (a player is on one team per set)
 * Those violations surface as a MongoServerError with code 11000, whose `keyPattern` says which index.
 *
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {ObjectId} options.userId - the creator
 * @returns {Promise<Object>} the new team
 */
async function createTeam ({ set, teamName, userId }) {
  const team = { set: { _id: set._id, name: set.name }, teamName, members: [userId] };
  const { insertedId } = await teams.insertOne(team);
  return { _id: insertedId, ...team };
}

export default createTeam;
