import { teams } from './collections.js';

/**
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {ObjectId} options.userId
 * @returns {Promise<Object>}
 */
async function createTeam ({ set, teamName, userId }) {
  const team = { set: { _id: set._id, name: set.name }, teamName, members: [userId] };
  const { insertedId } = await teams.insertOne(team);
  return { _id: insertedId, ...team };
}

export default createTeam;
