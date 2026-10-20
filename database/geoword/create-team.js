import { teams } from './collections.js';

/**
 * Creates a team with its creator as the only member.
 *
 * Does not check that the name is free or that the user is on no other team: the unique indexes
 * from tools/geoword/create-indexes.js do, atomically, so concurrent requests cannot both succeed.
 * Those violations surface as a MongoServerError with code 11000, whose `keyPattern` says which index.
 *
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {String} options.division
 * @param {ObjectId} options.userId - the creator
 * @returns {Promise<Object>} the new team
 */
async function createTeam ({ set, teamName, division, userId }) {
  const team = { set: { _id: set._id, name: set.name }, division, teamName, members: [userId] };
  const { insertedId } = await teams.insertOne(team);
  return { _id: insertedId, ...team };
}

export default createTeam;
