import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @param {ObjectId} tossupId
 * @returns {Promise<number>} - the number of tossup star documents deleted
 */
async function unstarTossup (userId, tossupId) {
  return (await tossupStars.deleteMany({ user_id: userId, tossup_id: tossupId })).deletedCount;
}

export default unstarTossup;
