import { buzzes } from '../../collections.js';

import getUsername from '../../../account-info/get-username.js';

async function getLeaderboard (packetName, division, includeInactive = false, limit = 100) {
  const aggregation = [
    { $match: { 'packet.name': packetName, division } },
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

  if (!includeInactive) {
    aggregation[0].$match.active = true;
  }

  const result = await buzzes.aggregate(aggregation).toArray();

  for (const index in result) {
    const userId = result[index]._id;
    result[index].username = await getUsername(userId);
  }

  return result;
}

export default getLeaderboard;
