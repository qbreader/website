import { buzzes, teams } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';

/**
 * @param {Object} options
 * @param {String} options.packetName
 * @param {ObjectId} options.viewerId
 * @param {ObjectId} [options.setId]
 * @returns {Promise<Array<{ division: string, questionNumber: number, username: string, teamName: string | null, celerity: number, points: number, givenAnswer: string, isYou: boolean, isTeammate: boolean }>>}
 */
async function getBuzzpoints ({ packetName, viewerId, setId }) {
  const buzzList = await buzzes.find(
    { 'packet.name': packetName, $or: [{ active: true }, { user_id: viewerId }] },
    { projection: { _id: 0, division: 1, questionNumber: 1, user_id: 1, celerity: 1, points: 1, givenAnswer: 1 }, sort: { celerity: -1 } }
  ).toArray();

  const teamList = setId ? await teams.find({ 'set._id': setId }, { projection: { _id: 0, teamName: 1, members: 1 } }).toArray() : [];
  const getTeamName = userId => teamList.find(team => team.members.some(id => id.equals(userId)))?.teamName ?? null;
  const viewerTeamName = getTeamName(viewerId);

  return await Promise.all(buzzList.map(async ({ user_id: userId, ...buzz }) => {
    const teamName = getTeamName(userId);
    const isYou = userId.equals(viewerId);
    return {
      ...buzz,
      username: await getUsername(userId),
      teamName,
      isYou,
      isTeammate: !isYou && viewerTeamName !== null && teamName === viewerTeamName
    };
  }));
}

export default getBuzzpoints;
