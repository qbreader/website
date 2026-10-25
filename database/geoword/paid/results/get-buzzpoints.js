import { buzzes } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';

/**
 * Every buzz on a packet, for showing where in each tossup each player buzzed.
 * Only buzzes that count toward standings are included, plus the viewer's own.
 * @param {Object} options
 * @param {String} options.packetName
 * @param {ObjectId} options.viewerId
 * @param {ObjectId[]} options.teamIds - the members of the viewer's team, if they have one
 * @returns {Promise<Array<{ division: string, questionNumber: number, username: string, celerity: number, points: number, givenAnswer: string, isYou: boolean, isTeammate: boolean }>>}
 * earliest buzz first
 */
async function getBuzzpoints ({ packetName, viewerId, teamIds }) {
  const buzzList = await buzzes.find(
    { 'packet.name': packetName, $or: [{ active: true }, { user_id: viewerId }] },
    { projection: { _id: 0, division: 1, questionNumber: 1, user_id: 1, celerity: 1, points: 1, givenAnswer: 1 }, sort: { celerity: -1 } }
  ).toArray();

  return await Promise.all(buzzList.map(async ({ user_id: userId, ...buzz }) => ({
    ...buzz,
    username: await getUsername(userId),
    isYou: userId.equals(viewerId),
    isTeammate: !userId.equals(viewerId) && teamIds.some(id => id.equals(userId))
  })));
}

export default getBuzzpoints;
