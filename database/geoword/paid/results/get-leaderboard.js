import { buzzes } from '../../collections.js';

import getDivisions from '../../get-divisions.js';
import getTeamLeaderboard from './get-team-leaderboard.js';
import { getPlayerPointsPerGame } from '../../../../server/geoword/play-round-robin.js';
import getUsername from '../../../account-info/get-username.js';

function getAggregation ({ division, includeInactive, packetName }) {
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
    }
    // Sorted and limited in getLeaderboard, since points per game comes from the team standings
  ];
}

/**
 * Orders players best first: points per game, then points, then correct answers, then average
 * celerity. Players without a points per game (not on a team that has played a match) go last.
 * @param {{ pointsPerGame: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number | null }} a
 * @param {{ pointsPerGame: number | null, points: number, numberCorrect: number, averageCorrectCelerity: number | null }} b
 * @returns {number} negative if `a` ranks above `b`
 */
function comparePlayers (a, b) {
  return (b.pointsPerGame ?? -1) - (a.pointsPerGame ?? -1) ||
    b.points - a.points ||
    b.numberCorrect - a.numberCorrect ||
    (b.averageCorrectCelerity ?? -1) - (a.averageCorrectCelerity ?? -1);
}

export default async function getLeaderboard ({ packetName, includeInactive = false, limit = 100 }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }
  const queries = divisions.map(division => {
    const aggregation = getAggregation({ division, includeInactive, packetName });
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
    divisions.map((division, index) => [division, results[index].sort(comparePlayers).slice(0, limit)])
  );
}
