import { buzzes } from './collections.js';

import getUsername from '../account-info/get-username.js';

async function getAdminStats (packetName, division) {
  const stats = await buzzes.aggregate([
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
  ]).toArray();

  for (const index in stats) {
    const question = stats[index];
    question.bestUsername = await getUsername(question.bestUserId);
  }

  return stats;
}

export default getAdminStats;
