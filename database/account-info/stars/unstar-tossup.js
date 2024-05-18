import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} user_id
 * @param {ObjectId} tossup_id
 * @returns {Promise<number>} - the number of tossup star documents deleted
 */
async function unstarTossup (user_id, tossup_id) {
  return (await tossupStars.deleteMany({ user_id, tossup_id })).deletedCount;
}

export default unstarTossup;
