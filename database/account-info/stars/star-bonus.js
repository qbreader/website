import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} bonusId
 * @returns {Promise<boolean>} true if the bonus was not starred before
 */
async function starBonus (userId, bonusId) {
  if (await bonusStars.findOne({ user_id: userId, bonus_id: bonusId })) {
    return false;
  }

  await bonusStars.insertOne({ user_id: userId, bonus_id: bonusId });
  return true;
}

export default starBonus;
