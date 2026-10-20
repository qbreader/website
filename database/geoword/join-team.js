import { teams } from './collections.js';
import getTeamByName from './get-team-by-name.js';

import { timingSafeEqual } from 'crypto';

/**
 * @param {String} a
 * @param {String} b
 * @returns {Boolean}
 */
function safeEqual (a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}

/**
 * @param {Object} options
 * @param {ObjectId} options.setId
 * @param {String} options.teamName
 * @param {String} options.code
 * @param {ObjectId} options.userId
 * @returns {Promise<Object | null>}
 */
async function joinTeam ({ setId, teamName, code, userId }) {
  const team = await getTeamByName(setId, teamName);
  if (!team?.code || !safeEqual(team.code, code.toUpperCase())) {
    return null;
  }

  return await teams.findOneAndUpdate({ _id: team._id }, { $addToSet: { members: userId } }, { returnDocument: 'after' });
}

export default joinTeam;
