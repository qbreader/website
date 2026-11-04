import { buzzes, packets, teams } from '../../collections.js';
import getQuestionCount from '../../get-question-count.js';
import mergeBuzzes from '../../../../server/geoword/merge-buzzes.js';
import playRoundRobin from '../../../../server/geoword/play-round-robin.js';

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
 * @param {{ wins: number, losses: number, ties: number }} record
 * @returns {number | null} the share of matches won, with a tie as half a win, or null before any match
 */
function getWinPercentage ({ wins, losses, ties }) {
  const played = wins + losses + ties;
  return played === 0 ? null : (wins + ties / 2) / played;
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

    const buzzesByUser = new Map();
    for (const buzz of buzzList) {
      const userBuzzes = buzzesByUser.get(String(buzz.user_id)) ?? [];
      userBuzzes.push(buzz);
      buzzesByUser.set(String(buzz.user_id), userBuzzes);
    }

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
        isYourTeam: Boolean(viewerId) && team.members.some(member => member.equals(viewerId))
      }))
      .filter(row => row.tossupsHeard > 0)
      // Teams yet to play a match go last
      .sort((a, b) =>
        (b.winPercentage ?? -1) - (a.winPercentage ?? -1) ||
        b.points - a.points ||
        b.numberCorrect - a.numberCorrect ||
        b.averageCorrectCelerity - a.averageCorrectCelerity
      );
  }));

  return Object.fromEntries(divisions.map((division, index) => [division, standings[index]]));
}
