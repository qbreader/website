import { teams } from './collections.js';
import generateTeamCode from './generate-team-code.js';

const MAX_CODE_GENERATION_ATTEMPTS = 5;

/**
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {ObjectId} options.userId
 * @returns {Promise<Object>}
 */
async function createTeam ({ set, teamName, userId }) {
  for (let attempt = 1; ; attempt++) {
    const team = { set: { _id: set._id, name: set.name }, teamName, code: generateTeamCode(), owner: userId, members: [userId] };
    try {
      const { insertedId } = await teams.insertOne(team);
      return { _id: insertedId, ...team };
    } catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.code || attempt === MAX_CODE_GENERATION_ATTEMPTS) { throw error; }
    }
  }
}

export default createTeam;
