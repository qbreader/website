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
 * @param {number} [options.maxSize] the most members a team may have; unlimited if omitted
 * @returns {Promise<{ team: Object | null, full: boolean }>} `team` is null if the name and code don't match or the team is full
 */
async function joinTeam ({ setId, teamName, code, userId, maxSize }) {
  const team = await getTeamByName(setId, teamName);
  if (!team?.code || !safeEqual(team.code, code.toUpperCase())) {
    return { team: null, full: false };
  }

  const filter = { _id: team._id, ...(maxSize !== undefined && { $expr: { $lt: [{ $size: '$members' }, maxSize] } }) };
  const joined = await teams.findOneAndUpdate(filter, { $addToSet: { members: userId } }, { returnDocument: 'after' });
  return { team: joined, full: !joined };
}

export default joinTeam;
