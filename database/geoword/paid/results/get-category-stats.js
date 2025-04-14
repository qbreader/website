import { buzzes } from '../../collections.js';

import getUsername from '../../../account-info/get-username.js';
import getDivisions from '../../get-divisions.js';

function getAggregation ({ division, includeInactive, packetName }) {
  return [
    {
      $match: {
        division,
        'packet.name': packetName,
        ...(!includeInactive && { active: true })
      }
    },
    { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
    { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined] } } },
    {
      $lookup: {
        from: 'tossups',
        localField: 'tossup_id',
        foreignField: '_id',
        as: 'tossup'
      }
    },
    { $unwind: '$tossup' },
    {
      $group: {
        _id: { category: '$tossup.category', user_id: '$user_id' },
        active: { $first: '$active' },
        averageCorrectCelerity: { $avg: '$correctCelerity' },
        numberCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        pointsPerTossup: { $avg: '$points' },
        points: { $sum: '$points' },
        number: { $sum: 1 }
      }
    },
    { $sort: { points: -1, averageCorrectCelerity: -1 } },
    {
      $addFields: {
        user: {
          active: '$active',
          averageCorrectCelerity: '$averageCorrectCelerity',
          numberCorrect: '$numberCorrect',
          pointsPerTossup: '$pointsPerTossup',
          points: '$points',
          number: '$number'
        }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        averageCorrectCelerity: { $avg: '$user.averageCorrectCelerity' },
        averagePoints: { $avg: '$user.points' },
        number: { $max: '$number' },
        users: { $push: { user: '$user', user_id: '$_id.user_id' } }
      }
    },
    { $addFields: { category: '$_id' } },
    { $sort: { category: 1 } }
  ];
}

async function getCategoryLeaderboard ({ packetName, includeInactive = false }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }

  const queries = divisions.map(division => {
    const aggregation = getAggregation({ division, includeInactive, packetName });
    return buzzes.aggregate(aggregation).toArray();
  });

  const results = await Promise.all(queries);
  for (const leaderboard of results) {
    for (const category of leaderboard) {
      for (const user of category.users) {
        user.user.username = await getUsername(user.user_id);
      }
    }
  }

  return Object.fromEntries(
    divisions.map((division, index) => [division, results[index]])
  );
}

export default getCategoryLeaderboard;
