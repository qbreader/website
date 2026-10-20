import { teams } from './collections.js';
import getTeamByName from './get-team-by-name.js';

import { timingSafeEqual } from 'crypto';

/**
 * @param {String} a
 * @param {String} b
 * @returns {Boolean} whether the strings are equal, in time that doesn't depend on where they differ
 */
function safeEqual (a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/**
 * Adds a user to the team with the given name in a set, if the code matches.
 *
 * A wrong name and a wrong code are indistinguishable to the caller, so names can't be probed.
 * Does not check that the user is on no other team: the unique index on `members` from
 * tools/geoword/create-indexes.js does, and a violation surfaces as a MongoServerError with code 11000.
 *
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {String} options.teamName - matched ignoring case
 * @param {String} options.code - matched exactly, after upper-casing
 * @param {ObjectId} options.userId
 * @returns {Promise<Object | null>} the team with the user added, or null if no team in the set has that name and code
 */
async function joinTeam ({ setId, teamName, code, userId }) {
  const team = await getTeamByName(setId, teamName);
  if (!team?.code || !safeEqual(team.code, code.toUpperCase())) {
    return null;
  }

  return await teams.findOneAndUpdate({ _id: team._id }, { $addToSet: { members: userId } }, { returnDocument: 'after' });
}

export default joinTeam;
