import mergeBuzzes from '../../merge-buzzes.js';
import simulateMatch from '../../simulate-match.js';
import getDivisionTeams from './get-division-teams.js';

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
 * Every pair of teams in a division plays one simulated match. A team plays only once
 * at least one of its members has finished the packet, and only finished members'
 * buzzes count, so a result doesn't change as the rest of the division plays.
 * @param {import('./get-division-teams.js').DivisionTeam[]} teamList - one division's teams
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
  const divisionTeams = await getDivisionTeams({ packetName, includeInactive });

  return Object.fromEntries(Object.entries(divisionTeams).map(([division, teamList]) => [
    division,
    playRoundRobin(teamList)
      .map((record, index) => ({
        ...scoreTeam(teamList[index].team, teamList[index].buzzes),
        ...record,
        winPercentage: getWinPercentage(record)
      }))
      // Teams yet to play a match go last
      .sort((a, b) => (b.winPercentage ?? -1) - (a.winPercentage ?? -1) || b.points - a.points || b.numberCorrect - a.numberCorrect || b.averageCorrectCelerity - a.averageCorrectCelerity)
  ]));
}
