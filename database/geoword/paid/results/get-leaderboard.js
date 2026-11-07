import { buzzes } from '../../collections.js';

import getDivisions from '../../get-divisions.js';
import getTeamLeaderboard from './get-team-leaderboard.js';
import { getPlayerPointsPerGame } from '../../../../server/geoword/play-round-robin.js';
import getUsername from '../../../account-info/get-username.js';

function getAggregation ({ division, includeInactive, packetName, limit }) {
  return [
    {
      $match: {
        division,
        'packet.name': packetName,
        ...(!includeInactive && { active: true })
      }
    },
    {
      $group: {
        _id: '$user_id',
        active: { $first: '$active' },
        numberCorrect: { $sum: { $cond: [{ $gt: ['$points', 0] }, 1, 0] } },
        points: { $sum: '$points' },
        pointsPerTossup: { $avg: '$points' },
        averageCorrectCelerity: { $avg: { $cond: [{ $gt: ['$points', 0] }, '$celerity', undefined] } }
      }
    },
    { $sort: { points: -1, numberCorrect: -1, averageCorrectCelerity: -1 } },
    { $limit: limit }
  ];
}

export default async function getLeaderboard ({ packetName, includeInactive = false, limit = 100 }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }
  const queries = divisions.map(division => {
    const aggregation = getAggregation({ division, includeInactive, packetName, limit });
    return buzzes.aggregate(aggregation).toArray();
  });

  const [results, teamLeaderboard] = await Promise.all([
    Promise.all(queries),
    getTeamLeaderboard({ packetName, includeInactive })
  ]);
  for (const [divisionIndex, result] of results.entries()) {
    const pointsPerGame = getPlayerPointsPerGame(teamLeaderboard[divisions[divisionIndex]] ?? []);
    for (const index in result) {
      const userId = result[index]._id;
      result[index].username = await getUsername(userId);
      result[index].pointsPerGame = pointsPerGame.get(String(userId)) ?? null;
    }
  }

  return Object.fromEntries(
    divisions.map((division, index) => [division, results[index]])
  );
}
