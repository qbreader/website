import { buzzes } from '../../collections.js';

import getDivisions from '../../get-divisions.js';
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
    { $sort: { points: -1, numberCorrect: -1 } },
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

  const results = await Promise.all(queries);
  for (const result of results) {
    for (const index in result) {
      const userId = result[index]._id;
      result[index].username = await getUsername(userId);
    }
  }

  return Object.fromEntries(
    divisions.map((division, index) => [division, results[index]])
  );
}
