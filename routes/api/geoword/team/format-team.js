import getUsername from '../../../../database/account-info/get-username.js';

/**
 * The view of a team that its members get.
 * @param {Object} team - a document from the `teams` collection
 * @param {ObjectId} userId - the member viewing it
 * @returns {Promise<Object>}
 */
export default async function formatTeam (team, userId) {
  const members = await Promise.all(team.members.map(async member => ({
    username: await getUsername(member),
    isOwner: String(member) === String(team.owner)
  })));

  return {
    teamName: team.teamName,
    division: team.division,
    code: team.code,
    members,
    isOwner: String(team.owner) === String(userId)
  };
}
