import { buzzes, packets, teams } from '../../collections.js';
import getQuestionCount from '../../get-question-count.js';
import mergeBuzzes from '../../merge-buzzes.js';
import simulateMatch from '../../simulate-match.js';

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
 * Every pair of teams in a division plays one simulated match. A team plays once at least
 * one of its members has finished the division.
 * @param {Array<{ team: Object, finishedBuzzes: Object[] }>} teamList - one division's teams,
 * with the buzzes of their members who have finished
 * @returns {Array<{ wins: number, losses: number, ties: number, matches: Array<{ opponent: string, points: [number, number] }> }>}
 * each team's record and matches, in the same order, with its own points first in each match
 */
function playRoundRobin (teamList) {
  const merged = teamList.map(({ finishedBuzzes }) => mergeBuzzes(finishedBuzzes));
  const records = teamList.map(() => ({ wins: 0, losses: 0, ties: 0, matches: [] }));

  for (let i = 0; i < teamList.length; i++) {
    for (let j = i + 1; j < teamList.length; j++) {
      if (merged[i].length === 0 || merged[j].length === 0) { continue; }
      const { points, winner } = simulateMatch(merged[i], merged[j]);
      for (const [side, own, other] of [[0, i, j], [1, j, i]]) {
        records[own][winner === null ? 'ties' : winner === side ? 'wins' : 'losses']++;
        records[own].matches.push({
          opponent: teamList[other].team.teamName,
          points: side === 0 ? points : [points[1], points[0]]
        });
      }
    }
  }

  return records;
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
 * @param {Boolean} [options.includeInactive] - count buzzes excluded from rankings
 * @returns {Promise<Object<string, Object[]>>} division name -> standings, best first
 */
export default async function getTeamLeaderboard ({ packetName, includeInactive = false }) {
  const packet = await packets.findOne({ name: packetName });
  const divisions = packet?.divisions;
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const teamList = await teams.find({ 'set._id': packet.set._id }).toArray();
  const members = teamList.flatMap(team => team.members);

  const standings = await Promise.all(divisions.map(async division => {
    if (teamList.length === 0) { return []; }

    // One query per division rather than one per team. Inactive buzzes still count
    // towards finishing the division, so they are filtered out afterwards.
    const [buzzList, questionCount] = await Promise.all([
      buzzes.find({ 'packet.name': packetName, division, user_id: { $in: members } }).toArray(),
      getQuestionCount(packetName, division)
    ]);

    const buzzesByUser = new Map();
    for (const buzz of buzzList) {
      const userBuzzes = buzzesByUser.get(String(buzz.user_id)) ?? [];
      userBuzzes.push(buzz);
      buzzesByUser.set(String(buzz.user_id), userBuzzes);
    }

    const counted = userBuzzes => includeInactive ? userBuzzes : userBuzzes.filter(buzz => buzz.active);
    const teamBuzzes = teamList.map(team => {
      const memberBuzzes = team.members.map(member => buzzesByUser.get(String(member)) ?? []);
      return {
        team,
        countedBuzzes: memberBuzzes.flatMap(counted),
        // Matches count only members who have finished, so results don't change while
        // the rest of the division plays
        finishedBuzzes: memberBuzzes.filter(userBuzzes => userBuzzes.length >= questionCount).flatMap(counted)
      };
    });
    const records = playRoundRobin(teamBuzzes);

    return teamBuzzes
      .map(({ team, countedBuzzes }, index) => ({
        ...scoreTeam(team, countedBuzzes),
        ...records[index],
        winPercentage: getWinPercentage(records[index])
      }))
      .filter(row => row.tossupsHeard > 0)
      // Teams yet to play a match go last
      .sort((a, b) => (b.winPercentage ?? -1) - (a.winPercentage ?? -1) || b.points - a.points || b.numberCorrect - a.numberCorrect || b.averageCorrectCelerity - a.averageCorrectCelerity);
  }));

  return Object.fromEntries(divisions.map((division, index) => [division, standings[index]]));
}
