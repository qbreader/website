import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<number>} The number of bonus stars cleared.
 */
export default async function clearBonusStars (userId) {
  const result = await bonusStars.deleteMany({ user_id: userId });
  return result.deletedCount;
}
