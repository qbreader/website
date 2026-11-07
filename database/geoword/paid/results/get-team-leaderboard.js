import { buzzes, packets, teams } from '../../collections.js';
import getQuestionCount from '../../get-question-count.js';
import { getPointsPerGame, getWinPercentage, playRoundRobin } from '../../../../server/geoword/play-round-robin.js';
import { compareStandings, scoreTeam } from '../../../../server/geoword/team-standings.js';

/**
 * @param {Object[]} buzzList - buzzes with a `user_id`
 * @returns {Map<string, Object[]>} each user's buzzes, keyed by the string form of their id
 */
function groupBuzzesByUser (buzzList) {
  const buzzesByUser = new Map();
  for (const buzz of buzzList) {
    const userBuzzes = buzzesByUser.get(String(buzz.user_id)) ?? [];
    userBuzzes.push(buzz);
    buzzesByUser.set(String(buzz.user_id), userBuzzes);
  }
  return buzzesByUser;
}

/**
 * Team standings for a packet, by division, ranked by win percentage in the simulated
 * matches and then by points.
 *
 * Individual buzzes are never modified: a team's score is derived at read time, so
 * changing the merge rule re-scores the tournament without touching stored data.
 *
 * @param {Object} options
 * @param {String} options.packetName
 * @param {ObjectId} [options.viewerId] - marks the viewer's team with `isYourTeam`
 * @param {Boolean} [options.includeInactive] - count buzzes excluded from rankings
 * @returns {Promise<Object<string, Object[]>>} division name -> standings, best first
 */
export default async function getTeamLeaderboard ({ packetName, viewerId, includeInactive = false }) {
  const packet = await packets.findOne({ name: packetName });
  const divisions = packet?.divisions;
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const teamList = await teams.find({ 'set._id': packet.set._id }).toArray();
  const members = teamList.flatMap(team => team.members);

  const standings = await Promise.all(divisions.map(async division => {
    if (teamList.length === 0) { return []; }

    // One query per division rather than one per team
    const [buzzList, questionCount] = await Promise.all([
      buzzes.find({
        'packet.name': packetName,
        division,
        user_id: { $in: members },
        ...(includeInactive ? {} : { active: true })
      }).toArray(),
      getQuestionCount(packetName, division)
    ]);

    const buzzesByUser = groupBuzzesByUser(buzzList);

    const teamEntries = teamList.map(team => {
      const memberBuzzes = team.members.map(member => buzzesByUser.get(String(member)) ?? []);
      return {
        team,
        countedBuzzes: memberBuzzes.flat(),
        // Matches count only members who have finished, so results don't change while
        // the rest of the division plays
        finishedBuzzes: memberBuzzes.filter(userBuzzes => userBuzzes.length >= questionCount).flat()
      };
    });
    const records = playRoundRobin(teamEntries);

    return teamEntries
      .map(({ team, countedBuzzes }, index) => ({
        ...scoreTeam(team, countedBuzzes),
        ...records[index],
        winPercentage: getWinPercentage(records[index]),
        pointsPerGame: getPointsPerGame(records[index]),
        isYourTeam: Boolean(viewerId) && team.members.some(member => member.equals(viewerId))
      }))
      .filter(row => row.tossupsHeard > 0)
      .sort(compareStandings);
  }));

  return Object.fromEntries(divisions.map((division, index) => [division, standings[index]]));
}
