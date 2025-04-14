import { buzzes } from './collections.js';

import getUsername from '../account-info/get-username.js';
import getDivisions from './get-divisions.js';

function getAggregation ({ division, packetName }) {
  return [
    { $match: { 'packet.name': packetName, division, active: true } },
    { $addFields: { isCorrect: { $gt: ['$points', 0] } } },
    { $addFields: { correctCelerity: { $cond: ['$isCorrect', '$celerity', undefined] } } },
    { $sort: { correctCelerity: -1 } },
    {
      $group: {
        _id: '$questionNumber',
        averageCorrectCelerity: { $avg: '$correctCelerity' },
        averagePoints: { $avg: '$points' },
        bestCelerity: { $max: '$correctCelerity' },
        bestUserId: { $first: '$user_id' },
        numberCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        tossup_id: { $first: '$tossup_id' },
        timesHeard: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } },
    {
      $lookup: {
        from: 'tossups',
        localField: 'tossup_id',
        foreignField: '_id',
        as: 'tossup'
      }
    },
    { $unwind: '$tossup' }
  ];
}

async function getAdminStats ({ packetName }) {
  const divisions = await getDivisions(packetName);
  if (!divisions || divisions.length === 0) {
    return {};
  }
  const queries = divisions.map(division => {
    const aggregation = getAggregation({ division, packetName });
    return buzzes.aggregate(aggregation).toArray();
  });

  const results = await Promise.all(queries);
  for (const result of results) {
    for (const document of result) {
      document.bestUsername = await getUsername(document.bestUserId);
    }
  }

  return Object.fromEntries(
    divisions.map((division, index) => [division, results[index]])
  );
}

export default getAdminStats;
