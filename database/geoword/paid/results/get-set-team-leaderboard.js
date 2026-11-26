import getTeamLeaderboard from './get-team-leaderboard.js';
import { getPointsPerGame, getWinPercentage } from '../../../../server/geoword/play-round-robin.js';
import { compareStandings } from '../../../../server/geoword/team-standings.js';

/**
 * Merge team standings across multiple packets in a single division into one cumulative standings object.
 * @param {Object[][]} standingsList - one division's standings from each packet, as built by `getTeamLeaderboard`
 * @returns {Object[]} the cumulative standings, best first, with the summed `matches` and `playerPoints`
 */
function mergeTeamStandings (standingsList) {
  const totals = new Map();

  for (const row of standingsList.flat()) {
    const total = totals.get(String(row.teamId)) ?? {
      teamId: row.teamId,
      teamName: row.teamName,
      memberCount: 0,
      isYourTeam: false,
      wins: 0,
      losses: 0,
      ties: 0,
      matches: [],
      playerPoints: {},
      numberCorrect: 0,
      points: 0,
      tossupsHeard: 0,
      correctCelerityTotal: 0
    };

    total.memberCount = Math.max(total.memberCount, row.memberCount);
    total.isYourTeam ||= row.isYourTeam;
    total.wins += row.wins;
    total.losses += row.losses;
    total.ties += row.ties;
    total.matches.push(...row.matches);
    for (const [player, points] of Object.entries(row.playerPoints)) {
      total.playerPoints[player] = (total.playerPoints[player] ?? 0) + points;
    }
    total.numberCorrect += row.numberCorrect;
    total.points += row.points;
    total.tossupsHeard += row.tossupsHeard;
    total.correctCelerityTotal += row.averageCorrectCelerity * row.numberCorrect;
    totals.set(String(row.teamId), total);
  }

  return Array.from(totals.values(), ({ correctCelerityTotal, ...total }) => ({
    ...total,
    pointsPerTossup: total.tossupsHeard === 0 ? 0 : total.points / total.tossupsHeard,
    averageCorrectCelerity: total.numberCorrect === 0 ? 0 : correctCelerityTotal / total.numberCorrect,
    winPercentage: getWinPercentage(total),
    pointsPerGame: getPointsPerGame(total)
  })).sort(compareStandings);
}

/**
 * Team standings added up across packets. See `mergeTeamStandings` for how.
 * @param {Object} options
 * @param {String[]} options.packetNames
 * @param {ObjectId} [options.viewerId] - marks the viewer's team with `isYourTeam`
 * @returns {Promise<Object<string, Object[]>>} division name -> cumulative standings, best first
 */
export default async function getSetTeamLeaderboard ({ packetNames, viewerId }) {
  const leaderboards = await Promise.all(packetNames.map(packetName => getTeamLeaderboard({ packetName, viewerId })));

  const divisions = new Set(leaderboards.flatMap(leaderboard => Object.keys(leaderboard)));
  return Object.fromEntries(Array.from(divisions, division => {
    const standings = mergeTeamStandings(leaderboards.map(leaderboard => leaderboard[division] ?? []));
    // The matches and per-player points are only needed to total PPG, so don't return them
    const rows = standings.map(({ matches, playerPoints, ...row }) => row);
    return [division, rows];
  }));
}
