import { buzzes, teams } from '../../collections.js';
import getDivisions from '../../get-divisions.js';
import mergeBuzzes from '../../merge-buzzes.js';

/**
 * Standings for one team, after its members' buzzes are merged question by question.
 * @param {Object} team - a document from the `teams` collection
 * @param {Object[]} teamBuzzes - every buzz by every member of that team
 * @returns {Object} the team's row in the standings
 */
function scoreTeam (team, teamBuzzes) {
  const merged = mergeBuzzes(teamBuzzes);
  const correct = merged.filter(buzz => buzz.points > 0);
  const points = merged.reduce((total, buzz) => total + buzz.points, 0);

  return {
    teamName: team.teamName,
    memberCount: team.members.length,
    numberCorrect: correct.length,
    points,
    // One row per question at least one member heard. Members play asynchronously and
    // may be at different points in the packet, so this is not the packet length until
    // everyone has finished - team PPTU is unstable before then.
    tossupsHeard: merged.length,
    pointsPerTossup: merged.length === 0 ? 0 : points / merged.length,
    averageCorrectCelerity: correct.length === 0
      ? 0
      : correct.reduce((total, buzz) => total + buzz.celerity, 0) / correct.length
  };
}

/**
 * Team standings for a packet, by division.
 *
 * Individual buzzes are never modified: a team's score is derived at read time, so
 * changing the merge rule re-scores the tournament without touching stored data.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {Boolean} [options.includeInactive] - count buzzes excluded from rankings
 * @returns {Promise<Object<string, Object[]>>} division name -> standings, best first
 */
export default async function getTeamLeaderboard ({ packetName, includeInactive = false }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const standings = await Promise.all(divisions.map(async division => {
    const teamList = await teams.find({ packetName, division }).toArray();
    if (teamList.length === 0) { return []; }

    // One query per division rather than one per team.
    const members = teamList.flatMap(team => team.members);
    const buzzList = await buzzes.find({
      'packet.name': packetName,
      division,
      user_id: { $in: members },
      ...(!includeInactive && { active: true })
    }).toArray();

    const buzzesByUser = new Map();
    for (const buzz of buzzList) {
      const userBuzzes = buzzesByUser.get(String(buzz.user_id)) ?? [];
      userBuzzes.push(buzz);
      buzzesByUser.set(String(buzz.user_id), userBuzzes);
    }

    return teamList
      .map(team => scoreTeam(team, team.members.flatMap(member => buzzesByUser.get(String(member)) ?? [])))
      .sort((a, b) => b.points - a.points || b.numberCorrect - a.numberCorrect);
  }));

  return Object.fromEntries(divisions.map((division, index) => [division, standings[index]]));
}
