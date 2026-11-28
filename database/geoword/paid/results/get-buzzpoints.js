import { buzzes, teams } from '../../collections.js';
import getUsername from '../../../account-info/get-username.js';

// Better points beat better celerity
function isBetterBuzz (buzz, other) {
  return buzz.points > other.points || (buzz.points === other.points && buzz.celerity > other.celerity);
}

/**
 * `rank` is the buzz's place among the active buzzes on the same question in the same division.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {ObjectId} options.viewerId
 * @param {ObjectId} [options.setId]
 * @returns {Promise<Array<{ division: string, questionNumber: number, username: string, teamName: string | null, celerity: number, points: number, givenAnswer: string, rank: number, isYou: boolean, isTeammate: boolean }>>}
 */
async function getBuzzpoints ({ packetName, viewerId, setId }) {
  const buzzList = await buzzes.find(
    { 'packet.name': packetName, $or: [{ active: true }, { user_id: viewerId }] },
    { projection: { _id: 0, active: 1, division: 1, questionNumber: 1, user_id: 1, celerity: 1, points: 1, givenAnswer: 1 }, sort: { celerity: -1 } }
  ).toArray();

  const getQuestionKey = buzz => `${buzz.division}/${buzz.questionNumber}`;
  const activeBuzzes = new Map();
  for (const buzz of buzzList.filter(buzz => buzz.active)) {
    const key = getQuestionKey(buzz);
    if (!activeBuzzes.has(key)) { activeBuzzes.set(key, []); }
    activeBuzzes.get(key).push(buzz);
  }
  const getRank = buzz => 1 + (activeBuzzes.get(getQuestionKey(buzz)) ?? []).filter(other => isBetterBuzz(other, buzz)).length;
  // Buzzes without a user count towards ranks but aren't listed
  const listedBuzzes = buzzList.filter(buzz => buzz.user_id !== null && buzz.user_id !== undefined);

  const teamList = setId ? await teams.find({ 'set._id': setId }, { projection: { _id: 0, teamName: 1, members: 1 } }).toArray() : [];
  const getTeamName = userId => teamList.find(team => team.members.some(id => id.equals(userId)))?.teamName ?? null;
  const viewerTeamName = getTeamName(viewerId);

  const userIds = new Map(listedBuzzes.map(buzz => [String(buzz.user_id), buzz.user_id]));
  const usernames = new Map(await Promise.all([...userIds].map(async ([key, userId]) => [key, await getUsername(userId)])));

  return listedBuzzes.map(({ active, user_id: userId, ...buzz }) => {
    const teamName = getTeamName(userId);
    const isYou = userId.equals(viewerId);
    return {
      ...buzz,
      rank: getRank(buzz),
      username: usernames.get(String(userId)),
      teamName,
      isYou,
      isTeammate: !isYou && viewerTeamName !== null && teamName === viewerTeamName
    };
  });
}

export default getBuzzpoints;
