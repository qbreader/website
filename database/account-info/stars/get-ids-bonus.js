import { bonusStars } from '../collections.js';

/**
 * Get the ids of a user's starred bonuses.
 * @param {ObjectId} userId - The user ID
 * @returns {Promise<ObjectId[]>} The bonus IDs
 */
export default async function getBonusIds (userId) {
  const aggregation = [
    { $match: { user_id: userId } },
    { $addFields: { insertTime: { $toDate: '$_id' } } },
    { $sort: { insertTime: -1 } }
  ];

  const bonusIds = await bonusStars.aggregate(aggregation).toArray();
  return bonusIds.map(bonus => bonus.bonus_id);
}
