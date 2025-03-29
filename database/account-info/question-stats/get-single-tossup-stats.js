import { perTossupData } from '../collections.js';

/**
 * Get the stats for a single tossup.
 * @param {ObjectId} tossupId the tossup id
 * @returns {Promise<Document>} the tossup stats
 */
async function getSingleTossupStats (tossupId) {
  const result = await perTossupData.aggregate([
    { $match: { tossup_id: tossupId } },
    {
      $addFields: {
        is15: { $gt: ['$pointValue', 10] },
        is10: { $eq: ['$pointValue', 10] },
        isNeg5: { $lt: ['$pointValue', 0] }
      }
    },
    {
      $group: {
        numCorrect: { $sum: { $cond: ['$isCorrect', 1, 0] } },
        _id: tossupId,
        count: { $sum: 1 },
        '15s': { $sum: { $cond: ['$is15', 1, 0] } },
        '10s': { $sum: { $cond: ['$is10', 1, 0] } },
        '-5s': { $sum: { $cond: ['$isNeg5', 1, 0] } },
        totalCelerity: { $sum: '$celerity' },
        totalCorrectCelerity: { $sum: { $cond: ['$isCorrect', '$celerity', 0] } },
        totalPoints: { $sum: '$pointValue' },
        pptu: { $avg: '$pointValue' }
      }
    }
  ]).toArray();

  return result[0];
}

export default getSingleTossupStats;
