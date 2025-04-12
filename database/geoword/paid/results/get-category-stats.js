import { buzzes } from '../../collections.js';

import getUsername from '../../../account-info/get-username.js';

async function getCategoryLeaderboard (packetName, division, includeInactive = false) {
  const aggregation = [
    { $match: { 'packet.name': packetName, division } },
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

  if (!includeInactive) {
    aggregation[0].$match.active = true;
  }

  const leaderboard = await buzzes.aggregate(aggregation).toArray();

  for (const category of leaderboard) {
    for (const user of category.users) {
      user.user.username = await getUsername(user.user_id);
    }
  }

  return leaderboard;
}

export default getCategoryLeaderboard;
