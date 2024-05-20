import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} bonusId
 * @returns {Promise<number>} - the number of bonus star documents deleted
 */
async function unstarBonus (userId, bonusId) {
  return (await bonusStars.deleteMany({ user_id: userId, bonus_id: bonusId })).deletedCount;
}

export default unstarBonus;
