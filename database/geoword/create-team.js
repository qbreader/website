import { teams } from './collections.js';
import generateTeamCode from './generate-team-code.js';

const MAX_CODE_ATTEMPTS = 5;

/**
 * Creates a team with its creator as the only member and its owner.
 *
 * Does not check that the name is free or that the user is on no other team: unique indexes on `teams` do,
 * atomically, so concurrent requests cannot both succeed:
 *   - `{ 'set._id': 1, teamName: 1 }`, with collation `{ locale: 'en', strength: 2 }` (names are unique ignoring case)
 *   - `{ 'set._id': 1, members: 1 }` (a player is on one team per set)
 *   - `{ 'set._id': 1, code: 1 }`, partial on `code` existing (join codes are unique within a set)
 * Those violations surface as a MongoServerError with code 11000, whose `keyPattern` says which index.
 * The team gets a random join code, regenerated if it collides with another team's in the set.
 *
 * @param {Object} options
 * @param {{ _id: ObjectId, name: string }} options.set
 * @param {String} options.teamName
 * @param {ObjectId} options.userId - the creator
 * @returns {Promise<Object>} the new team
 */
async function createTeam ({ set, teamName, userId }) {
  for (let attempt = 1; ; attempt++) {
    const team = { set: { _id: set._id, name: set.name }, teamName, code: generateTeamCode(), owner: userId, members: [userId] };
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
