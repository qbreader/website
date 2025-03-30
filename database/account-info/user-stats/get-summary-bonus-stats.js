import { perBonusData } from '../collections.js';
import generateMatchDocument from './generate-match-document.js';

/**
 * @param {ObjectId} userId
 * @param {'category' | 'subcategory' | 'alternate_subcategory'} groupByField
 * @param {Object} query
 * @param {Number[]} query.difficulties
 * @param {String} query.setName
 * @param {Boolean} query.includeMultiplayer
 * @param {Boolean} query.includeSingleplayer
 * @param {Date} query.startDate
 * @param {Date} query.endDate
 * @returns
 */
export default async function getSummaryBonusStats (userId, groupByField, query) {
  const matchDocument = await generateMatchDocument({ userId, ...query });
  return await perBonusData.aggregate([
    { $match: matchDocument },
    { $match: { [groupByField]: { $exists: true } } },
    { $unwind: '$data' },
    { $match: { 'data.user_id': userId } },
    { $addFields: { pointValue: { $sum: '$data.pointsPerPart' } } },
    {
      $addFields: {
        is30: { $eq: ['$pointValue', 30] },
        is20: { $eq: ['$pointValue', 20] },
        is10: { $eq: ['$pointValue', 10] },
        is0: { $eq: ['$pointValue', 0] }
      }
    },
    {
      $group: {
        _id: '$' + groupByField,
        count: { $sum: 1 },
        '30s': { $sum: { $cond: ['$is30', 1, 0] } },
        '20s': { $sum: { $cond: ['$is20', 1, 0] } },
        '10s': { $sum: { $cond: ['$is10', 1, 0] } },
        '0s': { $sum: { $cond: ['$is0', 1, 0] } },
        totalPoints: { $sum: '$pointValue' },
        ppb: { $avg: '$pointValue' }
      }
    },
    { $sort: { ppb: -1, totalPoints: -1 } }
  ]).toArray();
}
