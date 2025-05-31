import { tossupStars } from '../collections.js';

/**
 *
 * @param {ObjectId} userId
 * @returns {Promise<number>} The number of tossup stars cleared.
 */
export default async function clearTossupStars (userId) {
  const result = await tossupStars.deleteMany({ user_id: userId });
  return result.deletedCount;
}
