import { buzzes } from '../../collections.js';

import getSetTeamLeaderboard from './get-set-team-leaderboard.js';
import { comparePlayers } from '../../../../server/geoword/player-standings.js';
import { getPlayerPointsPerGame } from '../../../../server/geoword/play-round-robin.js';
import getUsername from '../../../account-info/get-username.js';

function getAggregation ({ packetNames }) {
  return [
    { $match: { 'packet.name': { $in: packetNames }, active: true } },
    {
      $group: {
        _id: { division: '$division', user_id: '$user_id' },
        numberCorrect: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } },
        points: { $sum: '$points' },
        pointsPerTossup: { $avg: '$points' },
        averageCorrectCelerity: { $avg: { $cond: [{ $gt: ['$points', 0] }, '$celerity', undefined] } }
      }
    }
  ];
}

/**
 * Individual standings added up across packets. A player's points are totaled over every
 * packet in `packetNames`, and PPG comes from the cumulative team standings.
 * @param {Object} options
 * @param {String[]} options.packetNames
 * @param {Number} [options.limit] - players to return per division
 * @returns {Promise<Object<string, Object[]>>} division name -> players, best first
 */
export default async function getSetLeaderboard ({ packetNames, limit = 100 }) {
  const [results, teamLeaderboard] = await Promise.all([
    buzzes.aggregate(getAggregation({ packetNames })).toArray(),
    getSetTeamLeaderboard({ packetNames })
  ]);

  const divisions = new Set([...results.map(result => result._id.division), ...Object.keys(teamLeaderboard)]);
  return Object.fromEntries(await Promise.all(Array.from(divisions, async division => {
    const pointsPerGame = getPlayerPointsPerGame(teamLeaderboard[division] ?? []);
    const players = await Promise.all(results
      .filter(result => result._id.division === division)
      .map(async ({ _id: { user_id: userId }, ...player }) => ({
        ...player,
        _id: userId,
        username: await getUsername(userId),
        pointsPerGame: pointsPerGame.get(String(userId)) ?? null
      })));
    return [division, players.sort(comparePlayers).slice(0, limit)];
  })));
}
