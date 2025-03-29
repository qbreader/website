import { perBonusData } from '../collections.js';

import getBonus from '../../qbreader/get-bonus.js';

/**
 * Get the stats for a single bonus.
 * @param {ObjectId} bonusId the bonus id
 * @returns {Promise<Document>} the bonus stats
 */
async function getSingleBonusStats (bonusId) {
  const bonus = await getBonus(bonusId);

  if (!bonus) {
    return null;
  }

  const result = await perBonusData.aggregate([
    { $match: { bonus_id: bonusId, pointsPerPart: { $size: bonus.parts.length } } },
    { $addFields: { pointValue: { $sum: '$pointsPerPart' } } },
    {
      $addFields: {
        convertedPart1: { $ne: [{ $arrayElemAt: ['$pointsPerPart', 0] }, 0] },
        convertedPart2: { $ne: [{ $arrayElemAt: ['$pointsPerPart', 1] }, 0] },
        convertedPart3: { $ne: [{ $arrayElemAt: ['$pointsPerPart', 2] }, 0] },
        is30: { $eq: ['$pointValue', 30] },
        is20: { $eq: ['$pointValue', 20] },
        is10: { $eq: ['$pointValue', 10] },
        is0: { $eq: ['$pointValue', 0] }
      }
    },
    {
      $group: {
        _id: bonusId,
        count: { $sum: 1 },
        '30s': { $sum: { $cond: ['$is30', 1, 0] } },
        '20s': { $sum: { $cond: ['$is20', 1, 0] } },
        '10s': { $sum: { $cond: ['$is10', 1, 0] } },
        '0s': { $sum: { $cond: ['$is0', 1, 0] } },
        part1: { $avg: { $cond: ['$convertedPart1', 1, 0] } },
        part2: { $avg: { $cond: ['$convertedPart2', 1, 0] } },
        part3: { $avg: { $cond: ['$convertedPart3', 1, 0] } },
        totalPoints: { $sum: '$pointValue' },
        ppb: { $avg: '$pointValue' }
      }
    }
  ]).toArray();

  return result[0];
}

export default getSingleBonusStats;
