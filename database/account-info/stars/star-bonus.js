import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @param {ObjectId} bonus_id
 * @returns {Promise<boolean>} true if the bonus was not starred before
 */
async function starBonus (user_id, bonus_id) {
  if (await bonusStars.findOne({ user_id, bonus_id })) {
    return false;
  }

  await bonusStars.insertOne({ user_id, bonus_id });
  return true;
}

export default starBonus;
