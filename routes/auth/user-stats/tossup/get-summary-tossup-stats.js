import { perTossupData } from '../../../../database/account-info/collections.js';
import generateMatchDocument from '../../../../database/account-info/user-stats/generate-match-document.js';

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
export default async function getSummaryTossupStats (userId, groupByField, query) {
  const matchDocument = await generateMatchDocument({ userId, ...query });
  return await perTossupData.aggregate([
    { $match: matchDocument },
    { $match: { [groupByField]: { $exists: true } } },
    { $unwind: '$data' },
    { $match: matchDocument },
    {
      $addFields: {
        is20: { $eq: ['$data.pointValue', 20] },
        is15: { $eq: ['$data.pointValue', 15] },
        is10: { $eq: ['$data.pointValue', 10] },
        isNeg5: { $lt: ['$data.pointValue', 0] }
      }
    },
    {
      $group: {
        numCorrect: { $sum: { $cond: ['$data.isCorrect', 1, 0] } },
        _id: '$' + groupByField,
        count: { $sum: 1 },
        '20s': { $sum: { $cond: ['$is20', 1, 0] } },
        '15s': { $sum: { $cond: ['$is15', 1, 0] } },
        '10s': { $sum: { $cond: ['$is10', 1, 0] } },
        '-5s': { $sum: { $cond: ['$isNeg5', 1, 0] } },
        totalCelerity: { $sum: '$data.celerity' },
        totalCorrectCelerity: { $sum: { $cond: ['$data.isCorrect', '$data.celerity', 0] } },
        totalPoints: { $sum: '$data.pointValue' },
        pptu: { $avg: '$data.pointValue' }
      }
    },
    {
      $addFields: {
        averageCorrectCelerity: { $cond: ['$numCorrect', { $divide: ['$totalCorrectCelerity', '$numCorrect'] }, 0] }
      }
    },
    ...(groupByField === 'set_id' ? [{ $match: { count: { $gt: 20 } } }] : []),
    { $sort: { count: -1, pptu: -1, averageCorrectCelerity: -1, totalPoints: -1 } }
  ]).toArray();
}
