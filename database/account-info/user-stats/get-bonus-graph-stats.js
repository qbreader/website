import { perBonusData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

async function getBonusGraphStats (userId, query) {
  const matchDocument = await generateMatchDocument({ userId, ...query });

  return await perBonusData.aggregate([
    { $match: matchDocument },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    { $addFields: { pointValue: { $sum: '$data.pointsPerPart' } } },
    {
      $addFields: {
        is30: { $eq: ['$pointValue', 30] },
        is20: { $eq: ['$pointValue', 20] },
        is10: { $eq: ['$pointValue', 10] },
        is0: { $eq: ['$pointValue', 0] },
        created: {
          $dateTrunc: {
            date: '$data.created',
            unit: 'day',
            binSize: 1,
            timezone: 'America/New_York'
          }
        }
      }
    },
    {
      $group: {
        _id: '$created',
        count: { $sum: 1 },
        '30s': { $sum: { $cond: ['$is30', 1, 0] } },
        '20s': { $sum: { $cond: ['$is20', 1, 0] } },
        '10s': { $sum: { $cond: ['$is10', 1, 0] } },
        '0s': { $sum: { $cond: ['$is0', 1, 0] } },
        totalPoints: { $sum: '$pointValue' },
        ppb: { $avg: '$pointValue' }
      }
    },
    { $sort: { _id: 1 } }
  ]).toArray();
}

export default getBonusGraphStats;
