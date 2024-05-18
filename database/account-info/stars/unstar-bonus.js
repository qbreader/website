import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @param {ObjectId} bonus_id
 * @returns {Promise<number>} - the number of bonus star documents deleted
 */
async function unstarBonus (user_id, bonus_id) {
  return (await bonusStars.deleteMany({ user_id, bonus_id })).deletedCount;
}

export default unstarBonus;
