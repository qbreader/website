import mergeBuzzes from './merge-buzzes.js';
import simulateMatch from './simulate-match.js';

/**
 * @param {null | 0 | 1} winner - the side that won a simulated match, or null for a tie
 * @param {0 | 1} side - the side a team played
 * @returns {'wins' | 'losses' | 'ties'} the key of the team's record to increment
 */
function getOutcome (winner, side) {
  if (winner === null) { return 'ties'; }
  return winner === side ? 'wins' : 'losses';
}

/**
 * Every pair of teams in a division plays one simulated match. A team plays once at least
 * one of its members has finished the division.
 * @param {Array<{ team: Object, finishedBuzzes: Object[] }>} teamList - one division's teams,
 * with the buzzes of their members who have finished
 * @returns {Array<{ wins: number, losses: number, ties: number, matches: Array<{ opponent: string, points: [number, number] }> }>}
 * each team's record and matches, in the same order, with its own points first in each match
 */
export function playRoundRobin (teamList) {
  const merged = teamList.map(({ finishedBuzzes }) => mergeBuzzes(finishedBuzzes));
  const records = teamList.map(() => ({ wins: 0, losses: 0, ties: 0, matches: [] }));

  for (let i = 0; i < teamList.length; i++) {
    for (let j = i + 1; j < teamList.length; j++) {
      if (merged[i].length === 0 || merged[j].length === 0) { continue; }
      const { points, winner } = simulateMatch(merged[i], merged[j]);
      const [pointsI, pointsJ] = points;
      records[i][getOutcome(winner, 0)]++;
      records[i].matches.push({ opponent: teamList[j].team.teamName, points: [pointsI, pointsJ] });
      records[j][getOutcome(winner, 1)]++;
      records[j].matches.push({ opponent: teamList[i].team.teamName, points: [pointsJ, pointsI] });
    }
  }

  return records;
}

/**
 * @param {{ wins: number, losses: number, ties: number }} record
 * @returns {number | null} the share of matches won, with a tie as half a win, or null before any match
 */
export function getWinPercentage ({ wins, losses, ties }) {
  const played = wins + losses + ties;
  return played === 0 ? null : (wins + ties / 2) / played;
}

/**
 * @param {{ matches: Array<{ points: [number, number] }> }} record
 * @returns {number | null} the team's average points across its simulated matches, or null before any match
 */
export function getPointsPerGame ({ matches }) {
  if (matches.length === 0) { return null; }
  return matches.reduce((total, { points }) => total + points[0], 0) / matches.length;
}
