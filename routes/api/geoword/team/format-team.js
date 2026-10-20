import getUsername from '../../../../database/account-info/get-username.js';

/**
 * @param {Object} team
 * @param {ObjectId} userId
 * @returns {Promise<Object>}
 */
export default async function formatTeam (team, userId) {
  const members = await Promise.all(team.members.map(async member => ({
    username: await getUsername(member),
    isOwner: member.equals(team.owner)
  })));

  return {
    teamName: team.teamName,
    code: team.code,
    members,
    isOwner: !!team.owner?.equals(userId)
  };
}
