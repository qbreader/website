import { bonusStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} bonusId
 * @returns {Promise<boolean>} true if the bonus was not starred before
 */
async function starBonus (userId, bonusId) {
  // get whether a document was inserted
  const result = await bonusStars.updateOne(
    { user_id: userId, bonus_id: bonusId },
    { $set: { user_id: userId, bonus_id: bonusId } },
    { upsert: true }
  );
  return result.upsertedCount > 0;
}

export default starBonus;
