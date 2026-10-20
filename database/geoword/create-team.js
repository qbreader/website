import { teams } from './collections.js';
import generateTeamCode from './generate-team-code.js';

const MAX_CODE_ATTEMPTS = 5;

/**
 * Creates a team with its creator as the only member.
 *
 * Does not check that the name is free or that the user is on no other team: the unique indexes
 * from tools/geoword/create-indexes.js do, atomically, so concurrent requests cannot both succeed.
 * Those violations surface as a MongoServerError with code 11000, whose `keyPattern` says which index.
 * The team gets a random join code, regenerated if it collides with another team's in the set.
 *
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {String} options.division
 * @param {ObjectId} options.userId - the creator
 * @returns {Promise<Object>} the new team
 */
async function createTeam ({ set, teamName, division, userId }) {
  for (let attempt = 1; ; attempt++) {
    const team = { set: { _id: set._id, name: set.name }, division, teamName, code: generateTeamCode(), members: [userId] };
    try {
      const { insertedId } = await teams.insertOne(team);
      return { _id: insertedId, ...team };
    } catch (error) {
      // A code already used in this set is retried with a fresh one; everything else is the caller's to handle.
      if (error.code !== 11000 || !error.keyPattern?.code || attempt === MAX_CODE_ATTEMPTS) { throw error; }
    }
  }
}

export default createTeam;
